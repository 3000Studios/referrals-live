import type { Env } from "../_lib";
import { badRequest, json, now, uid } from "../_lib";
import { requireUser } from "../_session";

const categories = new Set(["fintech", "crypto", "saas", "travel", "ecommerce", "health"]);

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function requireAdmin(request: Request, env: Env) {
  const user = await requireUser(request, env);
  return user?.isAdmin ? user : null;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  if (!(await requireAdmin(context.request, context.env))) return json({ ok: false, error: "Forbidden" }, { status: 403 });
  const rows = await context.env.DB.prepare(
    `SELECT s.id, s.offer_id, s.source_name, s.source_url, s.enabled, s.last_checked_at, s.last_http_status, s.last_error,
            o.title, o.review_status, o.verified_at
     FROM ingest_sources s JOIN ingested_offers o ON o.id=s.offer_id
     ORDER BY s.updated_at DESC LIMIT 100`,
  ).all<any>();
  return json({ ok: true, sources: rows.results ?? [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireAdmin(context.request, context.env);
  if (!user) return json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await context.request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(body?.action ?? "create");
  const ts = now();

  if (action === "review") {
    const offerId = String(body?.offerId ?? "");
    const reviewStatus = String(body?.reviewStatus ?? "");
    if (!offerId || !["approved", "rejected", "review_required"].includes(reviewStatus)) return badRequest("Choose a valid offer and review status.");
    await context.env.DB.prepare(
      "UPDATE ingested_offers SET review_status=?, verified_at=CASE WHEN ?='approved' THEN ? ELSE verified_at END, updated_at=? WHERE id=?",
    ).bind(reviewStatus, reviewStatus, ts, ts, offerId).run();
    return json({ ok: true });
  }

  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const sourceUrl = String(body?.sourceUrl ?? "").trim();
  const category = String(body?.category ?? "").trim();
  const tags = Array.isArray(body?.tags) ? body!.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 8) : [];
  const imageUrl = String(body?.imageUrl ?? "").trim();
  if (title.length < 3 || title.length > 120 || description.length < 20 || description.length > 800) return badRequest("Use a complete title and description.");
  if (!isHttpUrl(sourceUrl) || !isHttpUrl(imageUrl) || !categories.has(category)) return badRequest("Use valid HTTPS URLs and a supported category.");

  const offerId = uid("ingest");
  const sourceId = uid("source");
  await context.env.DB.batch([
    context.env.DB.prepare(
      `INSERT INTO ingested_offers
       (id, source, source_url, canonical_key, title, description, url, category, tags_json, image_url, score, created_at, updated_at, review_status)
       VALUES (?, 'official_source', ?, ?, ?, ?, ?, ?, ?, ?, 50, ?, ?, 'review_required')`,
    ).bind(offerId, sourceUrl, `official:${offerId}`, title, description, sourceUrl, category, JSON.stringify(tags), imageUrl, ts, ts),
    context.env.DB.prepare(
      `INSERT INTO ingest_sources (id, offer_id, source_name, source_url, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
    ).bind(sourceId, offerId, title, sourceUrl, ts, ts),
  ]);
  return json({ ok: true, offerId, sourceId });
}
