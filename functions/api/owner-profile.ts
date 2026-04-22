import type { Env } from "./_lib";
import { json, now, parseJson } from "./_lib";
import { requireUser } from "./_session";

type Body = {
  ownerName?: string;
  ownerEmail?: string;
  paypalEmail?: string;
  venmoHandle?: string;
  stripeEmail?: string;
  defaultReferralCode?: string;
  notes?: Record<string, string>;
};

const DEFAULT_PROFILE = {
  ownerName: "",
  ownerEmail: "",
  paypalEmail: "",
  venmoHandle: "",
  stripeEmail: "",
  defaultReferralCode: "",
  notes: {} as Record<string, string>,
};

export async function onRequestGet(context: { request: Request; env: Env }) {
  const row = await context.env.DB.prepare(
    "SELECT owner_name, owner_email, paypal_email, venmo_handle, stripe_email, default_referral_code, notes_json, updated_at FROM owner_profile WHERE id='owner' LIMIT 1",
  ).first<any>();

  return json({
    ok: true,
    profile: row
      ? {
          ownerName: row.owner_name ?? "",
          ownerEmail: row.owner_email ?? "",
          paypalEmail: row.paypal_email ?? "",
          venmoHandle: row.venmo_handle ?? "",
          stripeEmail: row.stripe_email ?? "",
          defaultReferralCode: row.default_referral_code ?? "",
          notes: JSON.parse(row.notes_json ?? "{}"),
          updatedAt: Number(row.updated_at ?? 0),
        }
      : DEFAULT_PROFILE,
    tokens: {
      OWNER_NAME: "{{OWNER_NAME}}",
      OWNER_EMAIL: "{{OWNER_EMAIL}}",
      PAYPAL_EMAIL: "{{PAYPAL_EMAIL}}",
      VENMO_HANDLE: "{{VENMO_HANDLE}}",
      STRIPE_EMAIL: "{{STRIPE_EMAIL}}",
      DEFAULT_REFERRAL_CODE: "{{DEFAULT_REFERRAL_CODE}}",
    },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await parseJson<Body>(context.request);
  const cleanNotes = Object.fromEntries(
    Object.entries(body.notes ?? {}).map(([key, value]) => [String(key).trim(), String(value ?? "").trim()]).filter(([key, value]) => key && value),
  );

  await context.env.DB.prepare(
    `INSERT OR REPLACE INTO owner_profile
      (id, owner_name, owner_email, paypal_email, venmo_handle, stripe_email, default_referral_code, notes_json, updated_at)
     VALUES ('owner', ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(body.ownerName ?? "").trim() || null,
      String(body.ownerEmail ?? "").trim() || null,
      String(body.paypalEmail ?? "").trim() || null,
      String(body.venmoHandle ?? "").trim() || null,
      String(body.stripeEmail ?? "").trim() || null,
      String(body.defaultReferralCode ?? "").trim() || null,
      JSON.stringify(cleanNotes),
      now(),
    )
    .run();

  return json({ ok: true });
}
