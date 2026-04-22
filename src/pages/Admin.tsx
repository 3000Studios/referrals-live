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

  useEffect(() => {
    load().catch(() => null);
    loadOwnerProfile().catch(() => null);
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
