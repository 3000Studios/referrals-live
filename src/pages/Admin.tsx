import { useEffect, useMemo, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";

type Item = { domain: string; params: Record<string, string>; updatedAt: number };
type OwnerProfile = {
  ownerName: string;
  ownerEmail: string;
  paypalEmail: string;
  venmoHandle: string;
  stripeEmail: string;
  defaultReferralCode: string;
  notes: Record<string, string>;
};
type Overview = {
  publicReferrals: number;
  activePremium: number;
  emailCaptures: number;
  activeFeaturedSlots: number;
  ingestedOffers: number;
  lastIngestedAt: number;
  stripeConfigured: boolean;
  adsTxtUrl: string;
  ownerRewardProfileReady: boolean;
  hqGateway: { webhookUrl: string; sharedSecretConfigured: boolean; updatedAt: number };
  automation: { autoFeatureAttributedFeed: boolean; autoFeatureLimit: number };
  crawlSchedule: string;
};

export function Admin() {
  const user = useAppStore((s) => s.user);
  const isAdmin = Boolean(user?.isAdmin);
  const [items, setItems] = useState<Item[]>([]);
  const [domain, setDomain] = useState("dropbox.com");
  const [paramsJson, setParamsJson] = useState('{\n  "ref": "YOUR_CODE_HERE"\n}');
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>({
    ownerName: "",
    ownerEmail: "",
    paypalEmail: "",
    venmoHandle: "",
    stripeEmail: "",
    defaultReferralCode: "",
    notes: {
      niche: "",
      preferredPrograms: "",
      payoutDestination: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [hqWebhookUrl, setHqWebhookUrl] = useState("");
  const [hqSharedSecret, setHqSharedSecret] = useState("");
  const [autoFeatureAttributedFeed, setAutoFeatureAttributedFeed] = useState(true);
  const [autoFeatureLimit, setAutoFeatureLimit] = useState(4);

  const load = async () => {
    const r = await fetch("/api/owner-attribution", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load");
    setItems(data.items ?? []);
  };

  const loadOwnerProfile = async () => {
    const r = await fetch("/api/owner-profile", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load owner profile");
    setOwnerProfile({
      ownerName: data.profile?.ownerName ?? "",
      ownerEmail: data.profile?.ownerEmail ?? "",
      paypalEmail: data.profile?.paypalEmail ?? "",
      venmoHandle: data.profile?.venmoHandle ?? "",
      stripeEmail: data.profile?.stripeEmail ?? "",
      defaultReferralCode: data.profile?.defaultReferralCode ?? "",
      notes: {
        niche: data.profile?.notes?.niche ?? "",
        preferredPrograms: data.profile?.notes?.preferredPrograms ?? "",
        payoutDestination: data.profile?.notes?.payoutDestination ?? "",
      },
    });
  };

  const loadOverview = async () => {
    const r = await fetch("/api/admin/overview", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load overview");
    setOverview(data.overview ?? null);
    setHqWebhookUrl(data.overview?.hqGateway?.webhookUrl ?? "");
    setHqSharedSecret("");
    setAutoFeatureAttributedFeed(data.overview?.automation?.autoFeatureAttributedFeed !== false);
    setAutoFeatureLimit(Number(data.overview?.automation?.autoFeatureLimit ?? 4));
  };

  useEffect(() => {
    load().catch(() => null);
    loadOwnerProfile().catch(() => null);
    loadOverview().catch(() => null);
  }, []);

  const note = useMemo(
    () =>
      `Set query parameters per domain that should be appended to outbound tracked links.\nExample: for a partner that uses ?ref=CODE, set domain + {"ref":"{{DEFAULT_REFERRAL_CODE}}"}.\nAvailable tokens: {{OWNER_NAME}}, {{OWNER_EMAIL}}, {{PAYPAL_EMAIL}}, {{VENMO_HANDLE}}, {{STRIPE_EMAIL}}, {{DEFAULT_REFERRAL_CODE}}.\nIf a domain isn't configured, we do not add parameters (prevents false claims).`,
    [],
  );

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Seo title="Admin — referrals.live" description="Admin dashboard." path="/admin" />
        <h1 className="font-display text-3xl font-bold text-white">Admin only</h1>
        <p className="mt-3 text-sm text-muted">Login as the owner admin account to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <Seo title="Admin — referrals.live" description="Configure owner attribution and ingestion." path="/admin" />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Owner controls</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Admin dashboard</h1>
      <p className="mt-3 max-w-3xl whitespace-pre-line text-sm text-muted">{note}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="glass rounded-3xl border border-white/10 p-6 lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Site command center</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Public referrals", overview?.publicReferrals ?? 0],
              ["Active premium", overview?.activePremium ?? 0],
              ["Email captures", overview?.emailCaptures ?? 0],
              ["Featured slots live", overview?.activeFeaturedSlots ?? 0],
              ["Ingested offers", overview?.ingestedOffers ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</div>
                <div className="mt-2 font-display text-3xl font-bold text-white">{String(value)}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Billing</div>
              <div className="mt-2 font-semibold text-white">{overview?.stripeConfigured ? "Stripe connected" : "Stripe needs attention"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Ads</div>
              <a className="mt-2 block font-semibold text-electric hover:text-white" href={overview?.adsTxtUrl ?? "/ads.txt"} target="_blank" rel="noreferrer">
                Check ads.txt →
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Reward profile</div>
              <div className="mt-2 font-semibold text-white">{overview?.ownerRewardProfileReady ? "Configured" : "Missing payout details"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Crawler</div>
              <div className="mt-2 font-semibold text-white">{overview?.crawlSchedule ?? "Every 30 minutes"}</div>
              <div className="mt-1 text-xs text-muted">
                {overview?.lastIngestedAt ? new Date(overview.lastIngestedAt).toLocaleString() : "Waiting for next run"}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Owner reward profile</div>
          <p className="mt-2 text-sm text-muted">
            These values are used to resolve token placeholders when tracked links build reward-ready outbound URLs.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["Owner name", "ownerName", "Mr. J Swain"],
              ["Owner email", "ownerEmail", "mr.jwswain@gmail.com"],
              ["PayPal email", "paypalEmail", "name@example.com"],
              ["Venmo handle", "venmoHandle", "@yourhandle"],
              ["Stripe email", "stripeEmail", "billing@example.com"],
              ["Default referral code", "defaultReferralCode", "YOURCODE123"],
            ].map(([label, key, placeholder]) => (
              <label key={String(key)} className="block text-xs uppercase tracking-wide text-muted">
                {label}
                <input
                  value={(ownerProfile as any)[key]}
                  onChange={(e) => setOwnerProfile((current) => ({ ...current, [key]: e.target.value }))}
                  placeholder={String(placeholder)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Primary niche", "niche", "fintech, travel, SaaS"],
              ["Preferred programs", "preferredPrograms", "cards, hosting, AI tools"],
              ["Payout destination", "payoutDestination", "PayPal / Venmo / Stripe"],
            ].map(([label, key, placeholder]) => (
              <label key={String(key)} className="block text-xs uppercase tracking-wide text-muted">
                {label}
                <input
                  value={ownerProfile.notes[key] ?? ""}
                  onChange={(e) =>
                    setOwnerProfile((current) => ({
                      ...current,
                      notes: { ...current.notes, [key]: e.target.value },
                    }))
                  }
                  placeholder={String(placeholder)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={async () => {
              setError(null);
              setSaved(false);
              try {
                const r = await fetch("/api/owner-profile", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(ownerProfile),
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data?.error ?? "Failed to save owner profile");
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to save owner profile");
              }
            }}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-gold to-yellow-300 px-6 py-4 text-sm font-semibold text-black"
          >
            Save reward profile
          </button>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">3000studios.vip gateway</div>
          <p className="mt-2 text-sm text-muted">
            Configure a headquarters webhook so this site can push crawl summaries and health signals into `3000studios.vip`.
          </p>
          <div className="mt-5 space-y-4">
            <label className="block text-xs uppercase tracking-wide text-muted">
              HQ webhook URL
              <input
                value={hqWebhookUrl}
                onChange={(e) => setHqWebhookUrl(e.target.value)}
                placeholder="https://3000studios.vip/api/hq/intake"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-muted">
              Shared secret
              <input
                value={hqSharedSecret}
                onChange={(e) => setHqSharedSecret(e.target.value)}
                placeholder="optional secret for secure posts"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <div className="text-xs text-muted">
              Status: <span className="text-white">{overview?.hqGateway?.webhookUrl ? "Connected" : "Not connected"}</span>
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
              <span>Auto-feature attributable offers on homepage</span>
              <input
                type="checkbox"
                checked={autoFeatureAttributedFeed}
                onChange={(e) => setAutoFeatureAttributedFeed(e.target.checked)}
                className="h-4 w-4 accent-lime-400"
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-muted">
              Auto-feature limit
              <input
                type="number"
                min={0}
                max={12}
                value={autoFeatureLimit}
                onChange={(e) => setAutoFeatureLimit(Number(e.target.value || 0))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setSaved(false);
                try {
                  const r = await fetch("/api/admin/overview", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      webhookUrl: hqWebhookUrl.trim(),
                      sharedSecret: hqSharedSecret.trim(),
                      autoFeatureAttributedFeed,
                      autoFeatureLimit,
                    }),
                  });
                  const data = await r.json();
                  if (!r.ok) throw new Error(data?.error ?? "Failed to save HQ gateway");
                  await loadOverview();
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1200);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to save HQ gateway");
                }
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-electric to-neon px-6 py-4 text-sm font-semibold text-black"
            >
              Save HQ gateway
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Owner attribution</div>
          <p className="mt-2 text-sm text-muted">
            Configure once. All tracked outbound clicks (`/go/:id`) will apply these params for matching domains.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-xs uppercase tracking-wide text-muted">
              Domain (no scheme)
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. wise.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-muted">
              Params JSON (key/value)
              <textarea
                value={paramsJson}
                onChange={(e) => setParamsJson(e.target.value)}
                rows={6}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 outline-none ring-neon/30 focus:ring"
              />
            </label>
            {error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
            ) : null}
            {saved ? (
              <div className="rounded-2xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm text-white">Saved.</div>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setSaved(false);
                try {
                  const parsed = JSON.parse(paramsJson);
                  const r = await fetch("/api/owner-attribution", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ domain: domain.trim(), params: parsed }),
                  });
                  const data = await r.json();
                  if (!r.ok) throw new Error(data?.error ?? "Failed to save");
                  await load();
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1200);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Invalid JSON");
                }
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-4 text-sm font-semibold text-black shadow-neon"
            >
              Save domain params
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Configured domains</div>
          <div className="mt-4 space-y-3 text-sm">
            {items.length ? (
              items.map((it) => (
                <div key={it.domain} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-white">{it.domain}</div>
                    <div className="text-xs text-muted">{new Date(it.updatedAt).toLocaleString()}</div>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 text-xs text-white/80">
                    {JSON.stringify(it.params, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-muted">
                No domains configured yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
