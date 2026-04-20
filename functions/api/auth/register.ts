import type { Env } from "../_lib";
import { badRequest, hashPassword, json, now, parseJson, setCookie, uid } from "../_lib";

type Body = { email: string; password: string; displayName: string };

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { DB } = context.env;
  const { email, password, displayName } = await parseJson<Body>(context.request);

  const cleanEmail = (email ?? "").trim().toLowerCase();
  const cleanName = (displayName ?? "").trim() || "Creator";
  if (!cleanEmail.includes("@")) return badRequest("Enter a valid email.");
  if (!password || password.length < 8) return badRequest("Password must be at least 8 characters.");

  const passwordHash = await hashPassword(password);
  const userId = uid("user");
  const ts = now();

  try {
    await DB.batch([
      DB.prepare(
        "INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      ).bind(userId, cleanEmail, cleanName, passwordHash, ts),
      DB.prepare(
        "INSERT OR REPLACE INTO subscriptions (user_id, status, current_period_end) VALUES (?, 'free', NULL)",
      ).bind(userId),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE") || msg.toLowerCase().includes("unique")) {
      return badRequest("Email already registered. Login instead.");
    }
    throw err;
  }

  const sessionId = uid("sess");
  const days = Number(context.env.SESSION_DAYS ?? "30") || 30;
  const maxAgeSeconds = days * 24 * 60 * 60;
  const expiresAt = ts + maxAgeSeconds * 1000;
  await DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(
    sessionId,
    userId,
    expiresAt,
    ts,
  ).run();

  const headers = new Headers();
  headers.set("Set-Cookie", setCookie("rl_session", sessionId, { maxAgeSeconds }));
  return json(
    { ok: true, user: { id: userId, email: cleanEmail, displayName: cleanName, premium: false } },
    { headers },
  );
}

