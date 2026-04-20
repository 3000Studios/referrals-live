import type { Env } from "./_lib";
import { getCookie, json, now } from "./_lib";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { DB } = context.env;
  const sessionId = getCookie(context.request, "rl_session");
  if (!sessionId) return json({ ok: true, user: null });

  const ts = now();
  const row = await DB.prepare(
    "SELECT u.id as id, u.email as email, u.display_name as display_name, s2.status as sub_status, s2.current_period_end as current_period_end FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN subscriptions s2 ON s2.user_id=u.id WHERE s.id=? AND s.expires_at>? LIMIT 1",
  )
    .bind(sessionId, ts)
    .first<any>();

  if (!row) return json({ ok: true, user: null });
  const premium = row.sub_status === "active" && (!row.current_period_end || Number(row.current_period_end) > ts);
  return json({ ok: true, user: { id: row.id, email: row.email, displayName: row.display_name, premium } });
}

