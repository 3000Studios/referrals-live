import type { Env } from "../_lib";
import { json, now, parseJson } from "../_lib";
import { requireUser } from "../_session";

type GatewayBody = {
  webhookUrl?: string;
  sharedSecret?: string;
  autoFeatureAttributedFeed?: boolean;
  autoFeatureLimit?: number;
};

async function requireAdmin(request: Request, env: Env) {
  const user = await requireUser(request, env);
  if (!user) return { error: json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  if (!user.isAdmin) return { error: json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const gate = await requireAdmin(context.request, context.env);
  if ("error" in gate) return gate.error;

  const ts = now();
  const db = context.env.DB;
  const [
    publicRefs,
    activePremium,
    emailCaptures,
    activeFeatured,
    ingested,
    gateway,
    automation,
    ownerProfile,
  ] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM referrals WHERE status='public'").first<any>(),
    db.prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE status='active' AND (current_period_end IS NULL OR current_period_end>?)").bind(ts).first<any>(),
    db.prepare("SELECT COUNT(*) AS count FROM email_captures").first<any>(),
    db.prepare("SELECT COUNT(*) AS count FROM featured_slots WHERE ends_at>?").bind(ts).first<any>(),
    db.prepare("SELECT COUNT(*) AS count, MAX(updated_at) AS updated_at FROM ingested_offers").first<any>(),
    db.prepare("SELECT value_json, updated_at FROM site_settings WHERE key='hq_gateway' LIMIT 1").first<any>(),
    db.prepare("SELECT value_json FROM site_settings WHERE key='automation' LIMIT 1").first<any>(),
    db.prepare("SELECT owner_email, paypal_email, venmo_handle, stripe_email, default_referral_code FROM owner_profile WHERE id='owner' LIMIT 1").first<any>(),
  ]);

  const gatewayValue = gateway?.value_json ? JSON.parse(gateway.value_json) : {};
  const automationValue = automation?.value_json ? JSON.parse(automation.value_json) : {};
  const ownerReady = Boolean(
    ownerProfile?.owner_email || ownerProfile?.paypal_email || ownerProfile?.venmo_handle || ownerProfile?.stripe_email || ownerProfile?.default_referral_code,
  );

  return json({
    ok: true,
    overview: {
      publicReferrals: Number(publicRefs?.count ?? 0),
      activePremium: Number(activePremium?.count ?? 0),
      emailCaptures: Number(emailCaptures?.count ?? 0),
      activeFeaturedSlots: Number(activeFeatured?.count ?? 0),
      ingestedOffers: Number(ingested?.count ?? 0),
      lastIngestedAt: Number(ingested?.updated_at ?? 0),
      stripeConfigured: Boolean(context.env.STRIPE_SECRET_KEY && context.env.STRIPE_PRICE_ID && context.env.STRIPE_WEBHOOK_SECRET),
      adsTxtUrl: `${context.env.APP_ORIGIN ?? "https://referrals.live"}/ads.txt`,
      ownerRewardProfileReady: ownerReady,
      hqGateway: {
        webhookUrl: String(gatewayValue.webhookUrl ?? ""),
        sharedSecretConfigured: Boolean(gatewayValue.sharedSecret),
        updatedAt: Number(gateway?.updated_at ?? 0),
      },
      automation: {
        autoFeatureAttributedFeed: automationValue.autoFeatureAttributedFeed !== false,
        autoFeatureLimit: Number(automationValue.autoFeatureLimit ?? 4),
      },
      crawlSchedule: "Every 30 minutes",
    },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const gate = await requireAdmin(context.request, context.env);
  if ("error" in gate) return gate.error;

  const body = await parseJson<GatewayBody>(context.request);
  const webhookUrl = String(body.webhookUrl ?? "").trim();
  const sharedSecret = String(body.sharedSecret ?? "").trim();
  const autoFeatureAttributedFeed = body.autoFeatureAttributedFeed !== false;
  const autoFeatureLimit = Math.max(0, Math.min(Number(body.autoFeatureLimit ?? 4), 12));
  if (webhookUrl) {
    try {
      const url = new URL(webhookUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid URL");
    } catch {
      return json({ ok: false, error: "Invalid webhook URL" }, { status: 400 });
    }
  }

  await context.env.DB.prepare(
    "INSERT OR REPLACE INTO site_settings (key, value_json, updated_at) VALUES ('hq_gateway', ?, ?)",
  )
    .bind(JSON.stringify({ webhookUrl, sharedSecret }), now())
    .run();

  await context.env.DB.prepare(
    "INSERT OR REPLACE INTO site_settings (key, value_json, updated_at) VALUES ('automation', ?, ?)",
  )
    .bind(JSON.stringify({ autoFeatureAttributedFeed, autoFeatureLimit }), now())
    .run();

  return json({ ok: true });
}
