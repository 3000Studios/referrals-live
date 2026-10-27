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
  termsAttested?: boolean;
};

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
  const rows = await DB.prepare(
    `SELECT r.id, r.user_id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, r.terms_attested, r.terms_flagged, m.votes, m.clicks
     FROM referrals r
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     WHERE r.status='public'
     ORDER BY COALESCE(m.clicks,0) DESC, COALESCE(m.votes,0) DESC, r.created_at DESC
     LIMIT 200`,
  ).all<any>();

  const referrals = (rows.results ?? []).map((r: any) => ({
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
    // 'system' = site catalog row; 'member' = a subscriber's own listing.
    // The homepage member boxes render member rows only, and only when the
    // member attested the program allows public posting and it isn't flagged.
    owner: r.user_id === "user-system" ? "system" : "member",
    termsAttested: Number(r.terms_attested ?? 0) === 1,
    termsFlagged: Number(r.terms_flagged ?? 0) === 1,
  }));

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

  // Terms check (business-model rule, 2026-10-27): many refer-a-friend
  // programs bar public posting. A link can only go public when the member
  // attests this program allows public posting of referral links.
  const termsAttested = body.termsAttested === true;
  if (status === "public_candidate" && !termsAttested) {
    return badRequest("To post publicly, confirm the program allows public posting of referral links.");
  }

  if (!title || !description) return badRequest("Title and description are required.");
  if (!isHttpUrl(url)) return badRequest("Enter a valid http(s) URL.");
  if (!category) return badRequest("Category is required.");
  if (!isHttpUrl(imageUrl)) return badRequest("Image URL must be a valid http(s) URL.");

  const id = uid("ref");
  const ts = now();
  const tagsJson = JSON.stringify(tags.length ? tags : ["community"]);

  await context.env.DB.batch([
    context.env.DB.prepare(
      "INSERT INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, terms_attested, terms_flagged, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
    ).bind(id, user.id, title, description, url, category, tagsJson, imageUrl, status, termsAttested ? 1 : 0, ts, ts),
    context.env.DB.prepare("INSERT INTO referral_metrics (referral_id, votes, clicks) VALUES (?, 0, 0)").bind(id),
  ]);

  return json({ ok: true, referral: { id } });
}

