import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";

async function requireAdmin(request: Request, env: Env) {
  const user = await requireUser(request, env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return json({ ok: false, error: "Forbidden" }, { status: 403 });
  return null;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const gate = await requireAdmin(context.request, context.env);
  if (gate) return gate;

  const rows = await context.env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.created_at, COALESCE(s.status, 'free') AS subscription_status,
            COALESCE(s.current_period_end, 0) AS current_period_end
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE u.id != 'user-system'
     ORDER BY u.created_at DESC
     LIMIT 250`,
  ).all<any>();

  return json({
    ok: true,
    users: (rows.results ?? []).map((row: any) => ({
      id: String(row.id),
      email: String(row.email),
      displayName: String(row.display_name ?? ""),
      createdAt: Number(row.created_at ?? 0),
      subscriptionStatus: String(row.subscription_status ?? "free"),
      currentPeriodEnd: Number(row.current_period_end ?? 0),
    })),
  });
}
