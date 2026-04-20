import type { Env } from "../_lib";
import { badRequest, json, now, parseJson, setCookie, uid, verifyPassword } from "../_lib";

type Body = { email: string; password: string };

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { DB } = context.env;
  const { email, password } = await parseJson<Body>(context.request);
  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!cleanEmail.includes("@")) return badRequest("Enter a valid email.");

  const row = await DB.prepare(
    "SELECT u.id as id, u.email as email, u.display_name as display_name, u.password_hash as password_hash, s.status as sub_status, s.current_period_end as current_period_end FROM users u LEFT JOIN subscriptions s ON s.user_id=u.id WHERE u.email=? LIMIT 1",
  )
    .bind(cleanEmail)
    .first<any>();

  if (!row) return badRequest("Invalid email or password.");
  const ok = await verifyPassword(password ?? "", row.password_hash);
  if (!ok) return badRequest("Invalid email or password.");

  const ts = now();
  const sessionId = uid("sess");
  const days = Number(context.env.SESSION_DAYS ?? "30") || 30;
  const maxAgeSeconds = days * 24 * 60 * 60;
  const expiresAt = ts + maxAgeSeconds * 1000;
  await DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(
    sessionId,
    row.id,
    expiresAt,
    ts,
  ).run();

  const premium = row.sub_status === "active" && (!row.current_period_end || Number(row.current_period_end) > ts);
  const headers = new Headers();
  headers.set("Set-Cookie", setCookie("rl_session", sessionId, { maxAgeSeconds }));
  return json(
    { ok: true, user: { id: row.id, email: row.email, displayName: row.display_name, premium } },
    { headers },
  );
}

