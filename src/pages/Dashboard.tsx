import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useViewerMode } from "@/store/useViewerMode";

type MyReferral = {
  id: string;
  title: string;
  status: string;
  votes: number;
  clicks: number;
};

export function Dashboard() {
  const user = useAppStore((s) => s.user);
  const hydrate = useAppStore((s) => s.hydrate);
  const { mode, setMode, isAdmin, premiumView } = useViewerMode();
  const [params] = useSearchParams();

  const [myReferrals, setMyReferrals] = useState<MyReferral[]>([]);
  const [slots, setSlots] = useState<Array<{ slot: 1 | 2; referralId: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const onboarding = params.get("onboarding") === "1";
  const [profile, setProfile] = useState<{ avatar?: string | null; color?: string | null }>({});

  const featuredMap = useMemo(() => {
    const m = new Map<number, string>();
    slots.forEach((s) => m.set(s.slot, s.referralId));
    return m;
  }, [slots]);

  const load = async () => {
    setError(null);
    await hydrate();
    const me = (await api.me()).user;
    if (!me) return;
    setProfile({ avatar: me.avatar ?? null, color: me.color ?? null });
    const [r, f] = await Promise.all([api.myReferrals(), api.featured()]);
    setMyReferrals(r.referrals as any);
    setSlots((f.slots ?? []).map((s: any) => ({ slot: s.slot as 1 | 2, referralId: s.referralId })));
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Seo title="Dashboard — referrals.live" description="Manage your referrals." path="/dashboard" />
        <h1 className="font-display text-3xl font-bold text-white">Sign in required</h1>
        <p className="mt-3 text-sm text-muted">Login to view your dashboard.</p>
        <Link className="mt-6 inline-flex rounded-2xl bg-neon px-6 py-3 text-sm font-semibold text-black" to="/login">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Seo title="Dashboard — referrals.live" description="Your submissions, featured slots, and premium status." path="/dashboard" />

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Operator desk</div>
          <h1 className="font-display text-4xl font-extrabold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-muted">
            Premium: <span className="text-white">{premiumView ? "active" : "not active"}</span>
          </p>
        </div>
        <Link
          to="/premium"
          className="rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          {premiumView ? "Manage billing" : "Upgrade"}
        </Link>
      </div>

      {isAdmin ? (
        <div className="mt-6 glass rounded-3xl border border-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">View mode</div>
            <div className="flex gap-2">
              {[
                { key: "user", label: "User" },
                { key: "premium", label: "Premium user" },
                { key: "admin", label: "Admin" },
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setMode(b.key as any)}
                  className={
                    mode === b.key
                      ? "rounded-2xl bg-neon px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black shadow-neon"
                      : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 hover:border-neon/40"
                  }
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted">
            This toggle is for testing UI states only. Billing + chat posting still require a real Premium subscription.
          </div>
          {mode === "admin" ? (
            <div className="mt-3">
              <Link
                to="/admin"
                className="inline-flex rounded-2xl border border-electric/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-electric hover:bg-electric/10"
              >
                Open admin dashboard →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 glass rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Profile</div>
            <div className="mt-2 text-sm text-muted">
              Avatar: <span className="text-white">{profile.avatar ?? "—"}</span> · Color:{" "}
              <span className="text-white">{profile.color ?? "—"}</span>
            </div>
          </div>
          <a
            href="/admin"
            className="rounded-2xl border border-electric/40 px-5 py-3 text-sm font-semibold text-electric hover:bg-electric/10"
          >
            Owner settings →
          </a>
        </div>
        <p className="mt-3 text-sm text-muted">
          Change your avatar + name color in the chat soon. (Next: profile editor UI.)
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {onboarding ? (
        <div className="mt-8 glass rounded-3xl border border-neon/30 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Onboarding</div>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">Post your first referral</h2>
          <p className="mt-2 text-sm text-muted">
            Free users can keep unlimited links in their dashboard. Premium users can feature 2 links on the homepage for 30 days.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/submit" className="rounded-2xl bg-neon px-6 py-3 text-sm font-semibold text-black shadow-neon">
              Add a referral
            </Link>
            <Link to="/premium" className="rounded-2xl border border-gold/40 px-6 py-3 text-sm font-semibold text-gold hover:bg-gold/10">
              Unlock Premium placements
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-white">Your referrals</h2>
          <Link to="/submit" className="text-sm font-semibold text-electric hover:text-white">
            New referral →
          </Link>
        </div>

        <div className="grid gap-4">
          {myReferrals.length ? (
            myReferrals.map((r) => (
              <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 p-4">
                <div>
                  <div className="font-semibold text-white">{r.title}</div>
                  <div className="text-xs text-muted">
                    {r.votes} votes · {r.clicks} clicks · <span className="text-white/80">{r.status}</span>
                  </div>
                </div>

                {premiumView ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2].map((slot) => {
                      const active = featuredMap.get(slot) === r.id;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            api
                              .setFeatured(slot as 1 | 2, r.id)
                              .then(() => load())
                              .catch((err) => setError(err instanceof Error ? err.message : "Failed to set featured slot."))
                          }
                          className={
                            active
                              ? "rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black shadow-neon"
                              : "rounded-2xl border border-neon/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neon hover:bg-neon/10"
                          }
                        >
                          Slot {slot}{active ? " ✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Link
                    to="/premium"
                    className="rounded-2xl border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gold hover:bg-gold/10"
                  >
                    Upgrade to feature
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="glass rounded-3xl border border-white/10 p-6 text-sm text-muted">
              No referrals yet.{" "}
              <Link className="text-electric hover:text-white" to="/submit">
                Submit your first referral
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
