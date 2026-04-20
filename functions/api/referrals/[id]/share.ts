import type { Env } from "../../_lib";
import { json, now, parseJson, uid } from "../../_lib";
import { requireUser } from "../../_session";

type Body = { channel: string };

export async function onRequestPost(context: { request: Request; env: Env; params: { id: string } }) {
  const user = await requireUser(context.request, context.env);
  const channel = (await parseJson<Body>(context.request))?.channel ?? "unknown";
  const id = context.params.id;
  const ts = now();
  await context.env.DB.prepare("INSERT INTO audit_log (id, user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, ?)").bind(
    uid("audit"),
    user?.id ?? null,
    "share",
    JSON.stringify({ referralId: id, channel }),
    ts,
  ).run();
  return json({ ok: true });
}
