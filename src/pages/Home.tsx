import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { sortByTrending, sortByPopular } from "@/lib/trending";
import { categories } from "@/data/categories";
import { SponsoredStrip } from "@/components/monetization/SponsoredStrip";
import { AdSlot } from "@/components/monetization/AdSlot";
import { EmailInlineCapture } from "@/components/growth/EmailInlineCapture";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LiveChatDock } from "@/components/community/LiveChatDock";

export function Home() {
  const referrals = useAppStore((s) => s.referrals);
  const heroRef = useRef<HTMLDivElement>(null);
  const [feedCount, setFeedCount] = useState(9);
  const [featured, setFeatured] = useState<typeof referrals>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const suggestedTags = ["SaaS", "Crypto", "Travel", "Cashback", "Hosting", "AI"];

  useEffect(() => {
    const root = heroRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-line", { y: 24, opacity: 0, stagger: 0.05, duration: 0.6, ease: "power2.out", clearProps: "all" });
      gsap.from(".hero-cta", { scale: 0.98, opacity: 0, duration: 0.45, delay: 0.3, ease: "power2.out", clearProps: "all" });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then((d) => setFeatured(d?.featured ?? []))
      .catch(() => null);
  }, []);

  const trending = useMemo(() => sortByTrending(referrals).slice(0, 6), [referrals]);
  const earning = useMemo(() => sortByPopular(referrals).slice(0, 4), [referrals]);
  const feed = useMemo(() => sortByTrending(referrals).slice(0, feedCount), [referrals, feedCount]);

  return (
    <div>
      <Seo
        title="referrals.live — Turn Your Links Into Money"
        description="Discover trending referral programs, submit your best links, and climb leaderboards. Built for creators, operators, and side hustlers."
        path="/"
      />

      <section ref={heroRef} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] via-transparent to-electric/10 px-6 py-16 md:px-14 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,136,0.18),transparent_45%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="hero-line font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Turn Your Links Into Money
          </div>
          <p className="hero-line mt-5 text-lg text-muted md:text-xl">
            A luxury-dark marketplace for referral programs: vote, share, and scale what actually converts — with{" "}
            <span className="text-neon">transparent rankings</span> and{" "}
            <span className="text-gold">monetization-ready</span> placements.
          </p>
          <div className="hero-cta mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/submit"
              className="inline-flex rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-8 py-4 text-sm font-semibold text-black shadow-neon"
            >
              Submit referral
            </Link>
            <Link
              to="/browse"
              className="inline-flex rounded-2xl border border-white/15 px-8 py-4 text-sm font-semibold text-white hover:border-neon/40"
            >
              Browse marketplace
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
            <span className="rounded-full border border-white/10 px-3 py-1">AdSense-ready</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Viral sharing</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Gamified ranks</span>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="w-full max-w-xl">
              <label className="sr-only" htmlFor="home-search">
                Search referrals
              </label>
              <input
                id="home-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search referral programs…"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-neon/30 focus:ring"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(`/browse?q=${encodeURIComponent(q.trim())}`)}
              className="w-full max-w-xl rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:border-neon/40 sm:w-auto"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("live-chat")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full max-w-xl rounded-2xl bg-gradient-to-r from-electric/60 to-neon/60 px-6 py-3 text-sm font-semibold text-white hover:brightness-110 sm:w-auto"
            >
              Jump to chat ↓
            </button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => navigate(`/browse?q=${encodeURIComponent(tag)}`)}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 hover:border-neon/40 hover:text-white"
              >
                #{tag}
              </button>
            ))}
          </div>
          <div className="mt-6 text-[11px] text-muted">
            Outbound clicks use tracked redirects. Owner-attribution parameters are applied only for domains you’ve configured.
          </div>
        </div>
      </section>

      <div className="mt-10 lg:hidden">
        <AdSlot variant="banner" />
      </div>

      <section className="mt-14 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Trending now</div>
            <h2 className="font-display text-3xl font-bold text-white">Referrals heating up</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">Score-based ranking blends votes, clicks, and recency.</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-electric hover:text-white">
            View all →
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {trending.map((r, i) => (
            <ReferralCard key={r.id} referral={r} index={i} variant="trending" />
          ))}
        </div>
      </section>

      <div className="mt-12">
        <SponsoredStrip />
      </div>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Top earning links</div>
          <h3 className="font-display text-2xl font-bold text-white">High signal, high intent</h3>
          <div className="space-y-3">
            {earning.map((r) => (
              <motion.div
                key={r.id}
                layout
                className="glass flex items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{r.title}</div>
                  <div className="text-xs text-muted">{r.category}</div>
                </div>
                <div className="text-right text-xs text-neon">
                  <div>{r.votes} votes</div>
                  <div className="text-muted">{r.clicks} clicks</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Leaderboard preview</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">Top operators</h3>
          <p className="mt-4 text-sm text-muted">
            Coming next: real leaderboards powered by verified clicks and subscriber performance.
          </p>
          <Link to="/leaderboard" className="mt-5 inline-flex text-sm font-semibold text-electric hover:text-white">
            Full leaderboard →
          </Link>
        </div>
      </section>

      {featured.length ? (
        <section className="mt-14 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Featured by members</div>
              <h2 className="font-display text-3xl font-bold text-white">Homepage placements</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">Premium members can feature 2 links at a time.</p>
            </div>
            <Link to="/premium" className="text-sm font-semibold text-electric hover:text-white">
              Upgrade →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featured.slice(0, 6).map((r, i) => (
              <ReferralCard key={`featured-${r.id}`} referral={r} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12">
        <AdSlot variant="in-feed" />
      </div>

      <section className="mt-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Categories</div>
            <h2 className="font-display text-3xl font-bold text-white">Pick your lane</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/browse?cat=${c.id}`}
              className="glass group rounded-3xl border border-white/10 p-6 transition hover:border-neon/40"
            >
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-3 font-display text-xl font-semibold text-white group-hover:text-neon">{c.name}</div>
              <p className="mt-2 text-sm text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Infinite discovery</div>
          <h2 className="font-display text-3xl font-bold text-white">Live feed</h2>
          <p className="mt-2 text-sm text-muted">Auto-rotating engagement keeps the marketplace feeling alive.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {feed.map((r, i) => (
            <ReferralCard key={`${r.id}-feed`} referral={r} index={i} />
          ))}
        </div>
        {feedCount < referrals.length ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setFeedCount((c) => Math.min(c + 6, referrals.length))}
              className="rounded-2xl border border-white/10 px-8 py-3 text-sm font-semibold text-white hover:border-neon/40"
            >
              Load more
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-16">
        <EmailInlineCapture />
      </section>

      <section id="live-chat" className="mt-16">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Community</div>
          <h2 className="font-display text-3xl font-bold text-white">Live chat</h2>
          <p className="mt-2 text-sm text-muted">Everyone can read. Premium members can post.</p>
        </div>
        <div className="mx-auto max-w-3xl">
          <LiveChatDock defaultOpen className="w-full" />
        </div>
      </section>
    </div>
  );
}
