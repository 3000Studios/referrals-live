import type { Env } from "../_lib";
import { json, serverError } from "../_lib";
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

  try {
    const tasks = await context.env.DB.prepare(
      "SELECT * FROM admin_tasks WHERE status = 'pending' ORDER BY created_at DESC"
    ).all();
    
    return json({ ok: true, tasks: tasks.results });
  } catch (err: any) {
    return serverError(err.message);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const gate = await requireAdmin(context.request, context.env);
  if (gate) return gate;

  const body = await context.request.json() as any;
  const { id, status } = body;

  if (!id || !status) {
    return serverError("Missing id or status");
  }

  try {
    await context.env.DB.prepare(
      "UPDATE admin_tasks SET status = ?, updated_at = ? WHERE id = ?"
    ).bind(status, Date.now(), id).run();
    
    return json({ ok: true });
  } catch (err: any) {
    return serverError(err.message);
  }
}
