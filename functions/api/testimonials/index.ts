import type { Env } from "../_lib";
import { badRequest, json, now } from "../_lib";
import { requireUser } from "../_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
  const offset = Math.min(Number(url.searchParams.get("offset") ?? "0"), 10000);

  try {
    // Get published testimonials
    const rows = await context.env.DB.prepare(
      `SELECT
        ct.id, ct.user_id, u.display_name, u.avatar, u.color,
        ct.referral_id, r.title, r.category,
        ct.title as testimonial_title, ct.story, ct.earnings_cents, ct.time_period, ct.image_url, ct.published_at
      FROM creator_testimonials ct
      JOIN users u ON u.id = ct.user_id
      JOIN referrals r ON r.id = ct.referral_id
      WHERE ct.status = 'published'
      ORDER BY ct.published_at DESC
      LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all<any>();

    const testimonials = (rows.results ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      creatorName: r.display_name,
      creatorAvatar: r.avatar,
      creatorColor: r.color,
      referralTitle: r.title,
      referralCategory: r.category,
      title: r.testimonial_title,
      story: r.story,
      earnings: r.earnings_cents ? r.earnings_cents / 100 : null,
      timePeriod: r.time_period,
      imageUrl: r.image_url,
      publishedAt: r.published_at,
    }));

    return json({ ok: true, testimonials, offset, limit });
  } catch (e) {
    console.error("Testimonials error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await context.request.json() as {
      referralId: string;
      title: string;
      story: string;
      earnings?: number;
      timePeriod?: string;
      imageUrl?: string;
    };

    if (!body.referralId) return badRequest("referralId required");
    if (!body.title || body.title.length < 5) return badRequest("title must be at least 5 chars");
    if (!body.story || body.story.length < 20) return badRequest("story must be at least 20 chars");

    // Verify referral belongs to user
    const ref = await context.env.DB.prepare(
      "SELECT id FROM referrals WHERE id = ? AND user_id = ? LIMIT 1"
    )
      .bind(body.referralId, user.id)
      .first<any>();

    if (!ref) return json({ ok: false, error: "Referral not found" }, { status: 404 });

    const id = `test_${Date.now()}`;
    const ts = now();
    const earningsCents = body.earnings ? Math.round(body.earnings * 100) : null;

    await context.env.DB.prepare(
      `INSERT INTO creator_testimonials (id, user_id, referral_id, title, story, earnings_cents, time_period, image_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
      .bind(
        id,
        user.id,
        body.referralId,
        body.title,
        body.story,
        earningsCents,
        body.timePeriod ?? "month",
        body.imageUrl ?? null,
        ts
      )
      .run();

    return json({ ok: true, testimonialId: id });
  } catch (e) {
    console.error("Testimonials POST error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}
