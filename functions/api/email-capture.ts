import type { Env } from "./_lib";
import { badRequest, json, now, parseJson, uid } from "./_lib";

type Body = { email: string; source: string };

export async function onRequestPost(context: { request: Request; env: Env }) {
  const body = await parseJson<Body>(context.request);
  const email = (body.email ?? "").trim().toLowerCase();
  const source = (body.source ?? "unknown").trim().slice(0, 64);
  if (!email.includes("@")) return badRequest("Invalid email");

  await context.env.DB.prepare("INSERT INTO email_captures (id, email, source, created_at) VALUES (?, ?, ?, ?)")
    .bind(uid("em"), email, source, now())
    .run();

  return json({ ok: true });
}

