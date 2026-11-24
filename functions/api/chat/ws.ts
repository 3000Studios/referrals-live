import type { Env } from "../_lib";
import { json } from "../_lib";

/**
 * Same-origin entry to the live chat room.
 *
 * The browser opens wss://referrals.live/api/chat/ws, so the first-party
 * rl_session cookie travels with the upgrade. This Function hands the
 * request straight to the ChatRoom Durable Object (one global room), which
 * checks the session and Premium status server-side before letting a socket
 * post. Nothing is relayed through here, so this costs one request per
 * connection and no CPU per message.
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return json({ ok: false, error: "Expected a WebSocket upgrade." }, { status: 426 });
  }
  if (!env.CHAT) return json({ ok: false, error: "Chat is not configured." }, { status: 503 });

  // Only the site itself may open sockets with the visitor's cookie.
  const origin = request.headers.get("Origin");
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).hostname;
    } catch {
      host = "";
    }
    const self = new URL(request.url).hostname;
    const allowed = host === self || host === "referrals.live" || host.endsWith(".referrals-live.pages.dev");
    if (!allowed) return json({ ok: false, error: "Forbidden origin." }, { status: 403 });
  }

  const room = env.CHAT.get(env.CHAT.idFromName("global"));
  const target = new URL(request.url);
  target.pathname = "/chat/ws";
  target.search = "";
  return room.fetch(new Request(target.toString(), request));
}
