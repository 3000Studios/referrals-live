import { json, serverError, unauthorized } from "../_lib";
import type { Env } from "../_lib";

export async function onRequestGet(context: { request: Request; env: any }) {
  // Simple check for admin status (could use session or a hardcoded token for now)
  // For production, this should check the session for isAdmin
  
  try {
    const tasks = await context.env.DB.prepare(
      "SELECT * FROM admin_tasks WHERE status = 'pending' ORDER BY created_at DESC"
    ).all();
    
    return json({ ok: true, tasks: tasks.results });
  } catch (err: any) {
    return serverError(err.message);
  }
}

export async function onRequestPost(context: { request: Request; env: any }) {
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
