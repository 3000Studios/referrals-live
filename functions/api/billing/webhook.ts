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

export async function onRequestPost(context: { request: Request; env: Env }) {
  const raw = await context.request.arrayBuffer();
  const ok = await verifyStripeWebhook(context.env, raw, context.request.headers.get("Stripe-Signature"));
  if (!ok) return json({ ok: false }, { status: 400 });

  const evt = JSON.parse(new TextDecoder().decode(raw)) as any;
  const type = evt.type as string;
  const obj = evt.data?.object;

  const db = context.env.DB;
  const ts = now();

  // We map via client_reference_id when present.
  const userId =
    obj?.client_reference_id ||
    obj?.metadata?.user_id ||
    obj?.metadata?.userId ||
    null;

  if (userId) {
    await db
      .prepare("INSERT INTO audit_log (id, user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(`audit-${crypto.randomUUID()}`, userId, "stripe_webhook", JSON.stringify({ type }), ts)
      .run();
  }

  if (type === "checkout.session.completed") {
    const subscriptionId = obj?.subscription as string | undefined;
    const customerId = obj?.customer as string | undefined;
    const clientRef = obj?.client_reference_id as string | undefined;
    if (clientRef) {
      await db
        .prepare(
          "INSERT OR REPLACE INTO subscriptions (user_id, stripe_customer_id, stripe_sub_id, status, current_period_end) VALUES (?, ?, ?, 'active', COALESCE(current_period_end, ?))",
        )
        .bind(clientRef, customerId ?? null, subscriptionId ?? null, ts + 30 * 24 * 60 * 60 * 1000)
        .run();

      // --- Affiliate Conversion Logic ---
      // Check if this user was referred
      const conversion = await db.prepare(
        "SELECT id, referrer_id, code FROM conversions WHERE referred_user_id = ? AND status = 'pending' LIMIT 1"
      ).bind(clientRef).first<any>();

      if (conversion) {
        const commission = 1000; // $10.00 flat commission for this demo
        await db.batch([
          db.prepare("UPDATE conversions SET status = 'completed', amount_cents = ? WHERE id = ?")
            .bind(commission, conversion.id),
          db.prepare("UPDATE affiliate_stats SET balance_cents = balance_cents + ?, total_conversions = total_conversions + 1 WHERE user_id = ?")
            .bind(commission, conversion.referrer_id)
        ]);
      }
      // ----------------------------------
    }
  }

  if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
    const subscriptionId = obj?.id as string | undefined;
    const customerId = obj?.customer as string | undefined;
    const currentPeriodEndSec = obj?.current_period_end as number | undefined;
    const status = obj?.status as string | undefined;
    const currentPeriodEnd = currentPeriodEndSec ? currentPeriodEndSec * 1000 : null;

    if (customerId && subscriptionId) {
      // Look up user by stripe_customer_id.
      const row = await db.prepare("SELECT user_id FROM subscriptions WHERE stripe_customer_id=? LIMIT 1").bind(customerId).first<any>();
      const targetUserId = row?.user_id;
      if (targetUserId) {
        const normalized = status === "active" || status === "trialing" ? "active" : "inactive";
        await db
          .prepare("UPDATE subscriptions SET stripe_sub_id=?, status=?, current_period_end=? WHERE user_id=?")
          .bind(subscriptionId, normalized, currentPeriodEnd, targetUserId)
          .run();
      }
    }
  }

  if (type === "customer.subscription.deleted") {
    const customerId = obj?.customer as string | undefined;
    if (customerId) {
      const row = await db.prepare("SELECT user_id FROM subscriptions WHERE stripe_customer_id=? LIMIT 1").bind(customerId).first<any>();
      if (row?.user_id) {
        await db
          .prepare("UPDATE subscriptions SET status='inactive', current_period_end=0 WHERE user_id=?")
          .bind(row.user_id)
          .run();
      }
    }
  }

  if (type === "payout.paid") {
    const payoutId = obj?.id as string;
    const amount = obj?.amount as number;
    const currency = obj?.currency as string;
    // Generate a consistent but obfuscated user ID for the ticker
    const obfuscatedId = `User_${Math.floor(Math.random() * 9000) + 1000}`; 

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
