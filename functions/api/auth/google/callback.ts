import type { Env } from "../../_lib";
import { clearCookie, getCookie, hashPassword, now, safeOrigin, setCookie, uid } from "../../_lib";

/**
 * Google sign-in — step 2: exchange the code, find-or-create the account,
 * open a normal rl_session (same session machinery as email login), and
 * land the member on their dashboard.
 *
 * Account matching: google_sub first, then email (an existing email/password
 * account gets its google_sub linked). New accounts get a random unusable
 * password hash — they sign in with Google only.
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { DB } = context.env;
  const origin = safeOrigin(context.env, new URL(context.request.url).origin);
  const fail = (code: string) => Response.redirect(`${origin}/login?error=${code}`, 302);

  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google_not_configured");

  const url = new URL(context.request.url);
  if (url.searchParams.get("error")) return fail("google_denied");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(context.request, "rl_oauth_state");
  if (!code || !state || !expectedState || state !== expectedState) return fail("google_state");

  // Exchange the authorization code for tokens.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = (await tokenRes.json().catch(() => null)) as { access_token?: string } | null;
  if (!tokenRes.ok || !tokenData?.access_token) return fail("google_token");

  // Read the verified Google profile.
  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json().catch(() => null)) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  } | null;
  if (!profileRes.ok || !profile?.sub || !profile?.email) return fail("google_profile");
  if (profile.email_verified !== true) return fail("google_unverified");

  const email = profile.email.trim().toLowerCase();
  const ts = now();

  let user = await DB.prepare("SELECT id FROM users WHERE google_sub=? LIMIT 1")
    .bind(profile.sub)
    .first<any>();
  if (!user) {
    user = await DB.prepare("SELECT id FROM users WHERE email=? LIMIT 1").bind(email).first<any>();
    if (user) {
      await DB.prepare("UPDATE users SET google_sub=? WHERE id=?").bind(profile.sub, user.id).run();
    }
  }
  if (!user) {
    const userId = uid("user");
    const displayName = (profile.name ?? "").trim() || email.split("@")[0] || "Creator";
    const passwordHash = await hashPassword(uid("google-only"));
    await DB.batch([
      DB.prepare(
        "INSERT INTO users (id, email, display_name, password_hash, avatar, color, google_sub, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(userId, email, displayName, passwordHash, "spark", "neon", profile.sub, ts),
      DB.prepare("INSERT OR REPLACE INTO subscriptions (user_id, status, current_period_end) VALUES (?, 'free', NULL)").bind(userId),
    ]);
    user = { id: userId };
  }

  // Open a session exactly like email login does.
  const sessionId = uid("sess");
  const days = Number(context.env.SESSION_DAYS ?? "30") || 30;
  const maxAgeSeconds = days * 24 * 60 * 60;
  const expiresAt = ts + maxAgeSeconds * 1000;
  await DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(sessionId, user.id, expiresAt, ts)
    .run();

  const headers = new Headers();
  headers.set("Location", `${origin}/dashboard`);
  headers.append("Set-Cookie", setCookie("rl_session", sessionId, { maxAgeSeconds }));
  headers.append("Set-Cookie", clearCookie("rl_oauth_state"));
  return new Response(null, { status: 302, headers });
}
