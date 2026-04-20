import type { Env } from "../api/_lib";
import { now } from "../api/_lib";

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  if (!id) return new Response("Missing id", { status: 400 });
  const db = context.env.DB;
  const row = await db
    .prepare("SELECT url FROM referrals WHERE id=? AND status='public' LIMIT 1")
    .bind(id)
    .first<any>();
  if (!row?.url) return new Response("Not found", { status: 404 });

  const ts = now();
  await db
    .prepare("UPDATE referral_metrics SET clicks=clicks+1, last_click_at=? WHERE referral_id=?")
    .bind(ts, id)
    .run();

  return Response.redirect(row.url, 302);
}

