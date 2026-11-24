import type { Env } from "../_lib";
import { json, now } from "../_lib";

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSha256(secret: string, payload: ArrayBuffer) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, payload);
  return new Uint8Array(sig);
}

function hex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseStripeSig(header: string | null) {
  if (!header) return null;
  const parts = header.split(",").map((p) => p.trim());
  const m: Record<string, string[]> = {};
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k || !v) continue;
    m[k] = m[k] ? [...m[k], v] : [v];
  }
  const t = m["t"]?.[0];
  const v1 = m["v1"] ?? [];
  if (!t || !v1.length) return null;
  return { t, v1 };
}

async function verifyStripeWebhook(env: Env, raw: ArrayBuffer, sigHeader: string | null) {
  if (!env.STRIPE_WEBHOOK_SECRET) return false;
  const parsed = parseStripeSig(sigHeader);
  if (!parsed) return false;
  // Reject replays of old signed events (Stripe's libraries use 5 minutes).
  const ageSec = Math.abs(Date.now() / 1000 - Number(parsed.t));
  if (!Number.isFinite(ageSec) || ageSec > 300) return false;
  const payloadToSign = new TextEncoder().encode(`${parsed.t}.`).buffer;
  // concatenate `${t}.` + raw
  const combined = new Uint8Array(payloadToSign.byteLength + raw.byteLength);
  combined.set(new Uint8Array(payloadToSign), 0);
  combined.set(new Uint8Array(raw), payloadToSign.byteLength);

  const computed = await hmacSha256(env.STRIPE_WEBHOOK_SECRET, combined.buffer);
  const computedHex = hex(computed);
  // allow any matching v1 signature
  return parsed.v1.some((sig) => timingSafeEqual(new TextEncoder().encode(sig), new TextEncoder().encode(computedHex)));
}

/** The live Premium Payment Link and price on the shared Stripe account. */
export const PREMIUM_PAYMENT_LINK_ID = "plink_1UVdBZGejm3JMan4UGJNU8PP";
export const PREMIUM_PRICE_ID = "price_1UVdBMGejm3JMan4GfOM4cOx";

type Db = D1Database;

/**
 * The Stripe account serves several 3000 Studios sites and every webhook
 * endpoint receives every event, so only act on checkouts that belong to
 * referrals.live: our own Checkout Sessions (site metadata) or the Premium
 * Payment Link. Access is granted only after the subscription itself is
 * confirmed to be on the Premium price (see isPremiumSubscription).
 */
export function isOurCheckout(obj: any) {
  return obj?.metadata?.site === "referrals.live" || obj?.payment_link === PREMIUM_PAYMENT_LINK_ID;
}

/** True only when the subscription has an item on the referrals.live Premium price. */
export function isPremiumSubscription(env: Env, sub: any) {
  const prices = new Set([PREMIUM_PRICE_ID, env.STRIPE_PRICE_ID].filter(Boolean));
  return ((sub?.items?.data ?? []) as any[]).some((it) => prices.has(it?.price?.id));
}

/** current_period_end moved onto subscription items in API 2025-03 (basil). */
export function periodEndMs(sub: any): number | null {
  const top = Number(sub?.current_period_end ?? 0);
  const item = Number(sub?.items?.data?.[0]?.current_period_end ?? 0);
  const sec = top || item;
  return sec ? sec * 1000 : null;
}

export function normalizeStatus(status: string | undefined) {
  // past_due keeps access while Stripe retries the card; the sub moves to
  // canceled or unpaid if retries fail, and access ends then.
  return status === "active" || status === "trialing" || status === "past_due" ? "active" : "inactive";
}

async function userIdForCheckout(db: Db, obj: any): Promise<string | null> {
  // Only the account id the site stamped on the checkout. Emails are not
  // verified at signup, so a payer's email never links a payment.
  const ref = String(obj?.client_reference_id ?? obj?.metadata?.user_id ?? "");
  if (!ref.startsWith("user-")) return null;
  const row = await db.prepare("SELECT id FROM users WHERE id=? LIMIT 1").bind(ref).first<any>();
  return row?.id ? String(row.id) : null;
}

export async function stripeGet(env: Env, path: string) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as any;
}

/** Writes the member's subscription row (insert or update). */
export async function upsertSubscription(
  db: Db,
  userId: string,
  fields: { customerId: string | null; subscriptionId: string | null; status: string; periodEnd: number | null },
) {
  await db
    .prepare(
      `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_sub_id, status, current_period_end)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         stripe_customer_id=COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
         stripe_sub_id=COALESCE(excluded.stripe_sub_id, subscriptions.stripe_sub_id),
         status=excluded.status,
         current_period_end=excluded.current_period_end`,
    )
    .bind(userId, fields.customerId, fields.subscriptionId, fields.status, fields.periodEnd)
    .run();
}

/** Activates Premium from a completed Checkout Session. Returns the user id. */
export async function activateFromCheckout(env: Env, obj: any): Promise<string | null> {
  const db = env.DB;
  if (!isOurCheckout(obj)) return null;
  if (obj?.status && obj.status !== "complete") return null;
  if (obj?.mode && obj.mode !== "subscription") return null;
  const userId = await userIdForCheckout(db, obj);
  if (!userId) return null;
  const subscriptionId = (typeof obj?.subscription === "string" ? obj.subscription : obj?.subscription?.id) ?? null;
  const customerId = (typeof obj?.customer === "string" ? obj.customer : obj?.customer?.id) ?? null;

  if (!subscriptionId) return null;
  // Confirm with Stripe that this is a referrals.live Premium subscription.
  const sub = await stripeGet(env, `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (!sub || !isPremiumSubscription(env, sub)) return null;
  const status = normalizeStatus(sub.status);
  const periodEnd = periodEndMs(sub) ?? now() + 35 * 24 * 60 * 60 * 1000;
  await upsertSubscription(db, userId, { customerId, subscriptionId, status, periodEnd });
  return userId;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const raw = await context.request.arrayBuffer();
  const ok = await verifyStripeWebhook(context.env, raw, context.request.headers.get("Stripe-Signature"));
  if (!ok) return json({ ok: false }, { status: 400 });

  const evt = JSON.parse(new TextDecoder().decode(raw)) as any;
  const type = evt.type as string;
  const obj = evt.data?.object;

  const db = context.env.DB;
  const ts = now();

  if (type === "checkout.session.completed") {
    const userId = await activateFromCheckout(context.env, obj);
    if (userId) {
      await db
        .prepare("INSERT INTO audit_log (id, user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(`audit-${crypto.randomUUID()}`, userId, "stripe_webhook", JSON.stringify({ type }), ts)
        .run()
        .catch(() => null);

      const conversion = await db.prepare(
        "SELECT id, referrer_id, code FROM conversions WHERE referred_user_id = ? AND status = 'pending' LIMIT 1"
      ).bind(userId).first<any>().catch(() => null);

      if (conversion) {
        const commission = 1000;
        await db.batch([
          db.prepare("UPDATE conversions SET status = 'completed', amount_cents = ? WHERE id = ?")
            .bind(commission, conversion.id),
          db.prepare("UPDATE affiliate_stats SET balance_cents = balance_cents + ?, total_conversions = total_conversions + 1 WHERE user_id = ?")
            .bind(commission, conversion.referrer_id)
        ]);
      }
    }
  }

  if (type === "customer.subscription.created" || type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
    const subscriptionId = obj?.id as string | undefined;
    const customerId = obj?.customer as string | undefined;
    if (subscriptionId) {
      // Find the member by subscription, then customer, then the user id we
      // stamp into subscription metadata at checkout.
      let row = await db.prepare("SELECT user_id FROM subscriptions WHERE stripe_sub_id=? LIMIT 1").bind(subscriptionId).first<any>();
      if (!row && customerId) {
        row = await db.prepare("SELECT user_id FROM subscriptions WHERE stripe_customer_id=? LIMIT 1").bind(customerId).first<any>();
      }
      const metaUser = String(obj?.metadata?.user_id ?? "");
      if (!row && metaUser.startsWith("user-")) {
        row = await db.prepare("SELECT id AS user_id FROM users WHERE id=? LIMIT 1").bind(metaUser).first<any>();
      }
      if (row?.user_id) {
        // Events can arrive out of order, so read the subscription as it is now.
        const live = (await stripeGet(context.env, `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`)) ?? obj;
        if (isPremiumSubscription(context.env, live)) {
          const ended = live?.status === "canceled" || (live === obj && type === "customer.subscription.deleted");
          const status = ended ? "inactive" : normalizeStatus(live?.status);
          await upsertSubscription(db, String(row.user_id), {
            customerId: customerId ?? null,
            subscriptionId,
            status,
            periodEnd: ended ? 0 : periodEndMs(live),
          });
        }
      }
    }
  }

  if (type === "payout.paid") {
    const payoutId = obj?.id as string;
    const amount = obj?.amount as number;
    const currency = obj?.currency as string;
    const obfuscatedId = `Stripe_${String(payoutId ?? "").slice(-8)}`;

    await db.prepare(
      "INSERT OR IGNORE INTO payout_logs (id, stripe_payout_id, amount_cents, currency, user_obfuscated_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      `payout-${crypto.randomUUID()}`,
      payoutId,
      amount,
      currency,
      obfuscatedId,
      "paid",
      ts
    ).run();
  }

  return json({ ok: true });
}
