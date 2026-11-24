import type { Env } from "../_lib";
import { badRequest, json, now, parseJson, uid } from "../_lib";
import { requireUser } from "../_session";
import { checkListing, normalizeListingUrl } from "../../../shared/moderation";

const DAILY_LISTING_LIMIT = 5;

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

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { DB } = context.env;
  const rows = await DB.prepare(
    `SELECT r.id, r.user_id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, r.terms_attested, r.terms_flagged, m.votes, m.clicks, u.display_name AS poster
     FROM referrals r
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     LEFT JOIN users u ON u.id=r.user_id
     WHERE r.status='public' AND (r.user_id='user-system' OR r.terms_flagged=0)
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
    poster: r.user_id === "user-system" ? null : String(r.poster ?? "Member").slice(0, 40),
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
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().slice(0, 24)).filter(Boolean).slice(0, 10)
    : [];
  const imageUrl = (body.imageUrl ?? "").trim();
  const wantsPublic = body.status === "public_candidate";

  // Terms check (business-model rule, 2026-10-27): many refer-a-friend
  // programs bar public posting. A link can only go public when the member
  // attests this program allows public posting of referral links.
  const termsAttested = body.termsAttested === true;
  if (wantsPublic && !user.premium) {
    return json({ ok: false, error: "Posting publicly is a Premium feature. Your link can still be saved privately." }, { status: 402 });
  }
  if (wantsPublic && !termsAttested) {
    return badRequest("To post publicly, confirm the program allows public posting of referral links.");
  }
  if (!category) return badRequest("Category is required.");

  // Content and link checks shared with the chat room.
  const verdict = checkListing({ title, description, url, imageUrl });
  if (!verdict.ok) return badRequest(verdict.reason);

  const db = context.env.DB;
  const ts = now();

  // Spam limits: a few new listings a day per member, and no duplicate
  // links. A link that another member already posted is theirs, not yours.
  const recent = await db
    .prepare("SELECT COUNT(*) AS n FROM referrals WHERE user_id=? AND created_at>?")
    .bind(user.id, ts - 24 * 60 * 60 * 1000)
    .first<any>();
  if (!user.isAdmin && Number(recent?.n ?? 0) >= DAILY_LISTING_LIMIT) {
    return json(
      { ok: false, error: `You can add ${DAILY_LISTING_LIMIT} links a day. Try again tomorrow.` },
      { status: 429 },
    );
  }
  const key = normalizeListingUrl(url);
  const host = key.split(/[/?]/)[0] ?? "";
  const sameHost = await db
    .prepare("SELECT user_id, url FROM referrals WHERE url LIKE ? LIMIT 200")
    .bind(`%${host}%`)
    .all<any>();
  for (const row of sameHost.results ?? []) {
    if (normalizeListingUrl(String(row.url)) !== key) continue;
    if (row.user_id === user.id) return badRequest("You already added this link.");
    return badRequest("Another member already posted this exact link. Post your own referral link instead.");
  }

  // Premium members who attest the terms and pass every check go live right
  // away; reports and admins can pull a listing afterwards. Everything else
  // stays on the member's private board.
  const status = wantsPublic ? "public" : "private";
  const id = uid("ref");
  const tagsJson = JSON.stringify(tags.length ? tags : ["community"]);

  await db.batch([
    db.prepare(
      "INSERT INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, terms_attested, terms_flagged, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
    ).bind(id, user.id, title, description, url, category, tagsJson, imageUrl, status, termsAttested ? 1 : 0, ts, ts),
    db.prepare("INSERT INTO referral_metrics (referral_id, votes, clicks) VALUES (?, 0, 0)").bind(id),
    db.prepare("INSERT INTO moderation_log (id, referral_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(
      uid("mod"),
      id,
      "auto",
      status === "public" ? "auto_published" : "saved_private",
      status === "public" ? "Premium, terms attested, passed link and content checks" : null,
      ts,
    ),
  ]);

  return json({ ok: true, referral: { id, status } });
}
