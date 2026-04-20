import type { Env } from "./_lib";
import { getCookie, now } from "./_lib";

export type SessionUser = { id: string; email: string; displayName: string; premium: boolean };

export async function requireUser(request: Request, env: Env): Promise<SessionUser | null> {
  const sessionId = getCookie(request, "rl_session");
  if (!sessionId) return null;
  const ts = now();
  const row = await env.DB.prepare(
    "SELECT u.id as id, u.email as email, u.display_name as display_name, s2.status as sub_status, s2.current_period_end as current_period_end FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN subscriptions s2 ON s2.user_id=u.id WHERE s.id=? AND s.expires_at>? LIMIT 1",
  )
    .bind(sessionId, ts)
    .first<any>();
  if (!row) return null;
  const premium = row.sub_status === "active" && (!row.current_period_end || Number(row.current_period_end) > ts);
  return { id: row.id, email: row.email, displayName: row.display_name, premium };
}

