import type { Env } from "../api/_lib";
import { now } from "../api/_lib";

function replaceTokens(value: string, profile: Record<string, string>) {
  return value.replace(/\{\{([A-Z_]+)\}\}/g, (_match, token) => profile[token] ?? "");
}

async function resolveTargetUrl(env: Env, id: string, ts: number): Promise<string | null> {
  const referral = await env.DB
    .prepare(
      `SELECT r.url AS url
       FROM referrals r
       LEFT JOIN featured_slots f ON f.referral_id=r.id AND f.ends_at>?
       WHERE r.id=? AND (r.status='public' OR f.referral_id IS NOT NULL)
       LIMIT 1`,
    )
    .bind(ts, id)
    .first<any>();
  if (referral?.url) {
    await env.DB
      .prepare("UPDATE referral_metrics SET clicks=clicks+1, last_click_at=? WHERE referral_id=?")
      .bind(ts, id)
      .run();
    return String(referral.url);
  }

  const ingested = await env.DB
    .prepare("SELECT url FROM ingested_offers WHERE id=? LIMIT 1")
    .bind(id)
    .first<any>();
  if (ingested?.url) {
    await env.DB
      .prepare(
        "UPDATE ingested_offers SET click_count = COALESCE(click_count, 0) + 1, last_click_at=? WHERE id=?",
      )
      .bind(ts, id)
      .run()
      .catch(() => null);
    return String(ingested.url);
  }

  return null;
}

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  if (!id) return new Response("Missing id", { status: 400 });
  const db = context.env.DB;
  const ts = now();

  const target = await resolveTargetUrl(context.env, id, ts);
  if (!target) return new Response("Not found", { status: 404 });

  let out = target;
  try {
    const u = new URL(out);
    const domain = u.hostname.replace(/^www\./, "").toLowerCase();
    const attr = await db.prepare("SELECT params_json FROM owner_attribution WHERE domain=? LIMIT 1").bind(domain).first<any>();
    const owner = await db.prepare(
      "SELECT owner_name, owner_email, paypal_email, venmo_handle, stripe_email, default_referral_code FROM owner_profile WHERE id='owner' LIMIT 1",
    ).first<any>();
    if (attr?.params_json) {
      const profile = {
        OWNER_NAME: String(owner?.owner_name ?? ""),
        OWNER_EMAIL: String(owner?.owner_email ?? ""),
        PAYPAL_EMAIL: String(owner?.paypal_email ?? ""),
        VENMO_HANDLE: String(owner?.venmo_handle ?? ""),
        STRIPE_EMAIL: String(owner?.stripe_email ?? ""),
        DEFAULT_REFERRAL_CODE: String(owner?.default_referral_code ?? ""),
      };
      const params = JSON.parse(attr.params_json) as Record<string, string>;
      Object.entries(params).forEach(([k, v]) => {
        if (!k || !v) return;
        const resolved = replaceTokens(String(v), profile).trim();
        if (!resolved) return;
        u.searchParams.set(k, resolved);
      });
      u.searchParams.set("utm_source", "referrals_live");
      u.searchParams.set("utm_medium", "curated_public");
      u.searchParams.set("utm_campaign", "owner_attribution");
      out = u.toString();
    }
  } catch {
    // keep original
  }

  return Response.redirect(out, 302);
}
