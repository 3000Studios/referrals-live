import type { Env } from "../_lib";
import { clearCookie, getCookie, json } from "../_lib";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const sessionId = getCookie(context.request, "rl_session");
  if (sessionId) {
    try {
      await context.env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(sessionId).run();
    } catch {
      // ignore
    }
  }
  const headers = new Headers();
  headers.set("Set-Cookie", clearCookie("rl_session"));
  return json({ ok: true }, { headers });
}

