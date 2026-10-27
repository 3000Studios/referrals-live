import type { Env } from "../_lib";
import { safeOrigin, setCookie, uid } from "../_lib";

/**
 * Google sign-in — step 1: bounce the visitor to Google's consent screen.
 *
 * Requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in the Pages env
 * (server-side only). Until they're set, this fails friendly: the visitor
 * lands back on /login with an explanatory error instead of a dead end.
 * The callback is /api/auth/google/callback (register that exact URL as an
 * authorized redirect URI on the OAuth client).
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const origin = safeOrigin(context.env, new URL(context.request.url).origin);
  const clientId = context.env.GOOGLE_CLIENT_ID;
  if (!clientId || !context.env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(`${origin}/login?error=google_not_configured`, 302);
  }

  const state = uid("state");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const headers = new Headers();
  headers.set("Location", `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  headers.set("Set-Cookie", setCookie("rl_oauth_state", state, { maxAgeSeconds: 600 }));
  return new Response(null, { status: 302, headers });
}
