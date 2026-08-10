import type { Env } from "../_lib";
import { badRequest, json, now, parseJson, uid } from "../_lib";
import { requireUser } from "../_session";

type CreateBody = {
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  imageUrl: string;
  status?: "private" | "public_candidate";
};

const categories = new Set(["fintech", "crypto", "saas", "travel", "ecommerce", "health"]);

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { DB } = context.env;
  const [memberRows, ingestedRows] = await Promise.all([
    DB.prepare(
    `SELECT r.id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, m.votes, m.clicks
     FROM referrals r
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     WHERE r.status='public'
     ORDER BY COALESCE(m.clicks,0) DESC, COALESCE(m.votes,0) DESC, r.created_at DESC
     LIMIT 200`,
    ).all<any>(),
    DB.prepare(
      `SELECT id, title, description, url, category, tags_json, image_url, score, created_at, verified_at
       FROM ingested_offers
       WHERE review_status='approved'
       ORDER BY score DESC, verified_at DESC, updated_at DESC
       LIMIT 200`,
    ).all<any>(),
  ]);

  const referrals = [
    ...(memberRows.results ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    category: r.category,
    tags: JSON.parse(r.tags_json ?? "[]"),
    image: r.image_url,
    votes: Number(r.votes ?? 0),
    clicks: Number(r.clicks ?? 0),
    createdAt: Number(r.created_at ?? now()),
    visibility: "public",
    source: "member",
    })),
    ...(ingestedRows.results ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      url: r.url,
      category: r.category,
      tags: JSON.parse(r.tags_json ?? "[]"),
      image: r.image_url,
      votes: 0,
      clicks: 0,
      createdAt: Number(r.created_at ?? now()),
      visibility: "public",
      source: "verified_source",
      verifiedAt: Number(r.verified_at ?? 0),
    })),
  ];

  return json({ ok: true, referrals });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await parseJson<CreateBody>(context.request);
  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const url = (body.url ?? "").trim();
  const category = (body.category ?? "").trim();
  const tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10) : [];
  const imageUrl = (body.imageUrl ?? "").trim();
  const status = body.status === "public_candidate" && user.premium ? "public_candidate" : "private";

  if (title.length < 3 || title.length > 120) return badRequest("Title must be 3 to 120 characters.");
  if (description.length < 20 || description.length > 800) return badRequest("Description must be 20 to 800 characters.");
  if (!isHttpUrl(url)) return badRequest("Enter a valid http(s) URL.");
  if (!categories.has(category)) return badRequest("Choose a valid category.");
  if (!isHttpUrl(imageUrl)) return badRequest("Image URL must be a valid http(s) URL.");

  const id = uid("ref");
  const ts = now();
  const tagsJson = JSON.stringify(tags.length ? tags : ["community"]);

  await context.env.DB.batch([
    context.env.DB.prepare(
      "INSERT INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, user.id, title, description, url, category, tagsJson, imageUrl, status, ts, ts),
    context.env.DB.prepare("INSERT INTO referral_metrics (referral_id, votes, clicks) VALUES (?, 0, 0)").bind(id),
  ]);

  return json({ ok: true, referral: { id } });
}

