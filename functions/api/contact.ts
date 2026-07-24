import type { Env } from "./_lib";
import { badRequest, json, parseJson, sendLead } from "./_lib";

type Body = { name?: string; email?: string; message?: string };

export async function onRequestPost(context: { request: Request; env: Env }) {
  const body = await parseJson<Body>(context.request).catch(() => null);
  const name = body?.name?.trim().slice(0, 120) ?? "";
  const email = body?.email?.trim().toLowerCase().slice(0, 254) ?? "";
  const message = body?.message?.trim().slice(0, 4_000) ?? "";

  if (!name || !email.includes("@") || !message) return badRequest("Please complete all fields.");
  const delivered = await sendLead(context.env, { type: "contact", name, email, message });
  if (!delivered) return json({ ok: false, error: "Contact delivery is unavailable." }, { status: 503 });

  return json({ ok: true });
}
