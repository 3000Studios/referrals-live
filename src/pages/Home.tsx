import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { HoverVideo } from "@/components/media/HoverVideo";
import { sortByTrending } from "@/lib/trending";
import { categories } from "@/data/categories";
import { EmailInlineCapture } from "@/components/growth/EmailInlineCapture";
import { AdSlot } from "@/components/monetization/AdSlot";
import { MUSE_INVITE_URL, HONEY_REF_URL, SOFI_CRYPTO_URL } from "@/data/featured";
import { HERO_VIDEO, videoForCategory } from "@/data/media";

const FAQS = [
  {
    q: "Is referrals.live really free?",
    a: "Yes. Browsing and clicking deals is free forever — no account needed. You only pay if you choose Pro, which lets you post your own referral links publicly and get featured placement.",
  },
  {
    q: "How do I earn from a deal here?",
    a: "Click a deal, sign up on that company's site through the link, and complete whatever the program asks (for example, opening an account or making a first purchase). The company pays the bonus — to you, and a referral credit to the poster. Every program sets its own terms on its own page.",
  },
  {
    q: "How does referrals.live make money?",
    a: "Two honest ways: some links on this site are the owner's own referral links (they're labeled), so the owner earns the referral credit when you sign up; and Pro members pay a subscription to post and feature their links. Full details are on our disclosure page.",
  },
  {
    q: "How do I post my own referral link?",
    a: "Create a free account, then go Pro to publish your links publicly and pin up to 2 featured placements on the homepage. Free accounts can save links on their private board.",
  },
  {
    q: "Are these programs legit?",
    a: "Every catalog listing links to the program's official page, and we re-verify links regularly. Always read the program's own terms before signing up — bonuses and requirements change.",
  },
];

export function Home() {
  const referrals = useAppStore((s) => s.referrals);
  const [feedCount, setFeedCount] = useState(9);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const trending = useMemo(() => sortByTrending(referrals).slice(0, 6), [referrals]);
  const feed = useMemo(() => sortByTrending(referrals).slice(0, feedCount), [referrals, feedCount]);
  const honey = useMemo(() => referrals.find((r) => r.id === "ref-honey"), [referrals]);

  return (
    <div>
      <Seo
        title="referrals.live — Click a deal. Sign up. You earn, we earn."
        description="Free referral deals that pay both sides: click a deal, sign up, and you get a bonus while the poster earns too. Post your own links with Pro."
        path="/"
      />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-[2rem] border border-gold/20 px-6 py-16 md:px-14 md:py-24">
        {HERO_VIDEO ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={HERO_VIDEO.src}
            poster={HERO_VIDEO.poster}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_20%_0%,rgba(255,215,0,0.16),transparent_55%),radial-gradient(ellipse_55%_45%_at_85%_100%,rgba(201,150,46,0.14),transparent_55%)]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/50 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Free forever — no account needed to grab a deal</span>
            </div>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">
              Click a deal. Sign up.
              <br />
              <span className="bg-gold-gradient bg-clip-text text-transparent">You earn — we earn.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-white/75 lg:mx-0 md:text-lg">
              Every link here pays a bonus. You get the signup bonus, the person who posted the link
              gets a referral credit, and the company pays for both. That is the whole model — no
              tricks, nothing to buy to browse.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-8 py-4 text-sm font-bold text-black shadow-gold transition hover:brightness-110 active:scale-95"
              >
                Browse deals →
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/40 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-gold/50"
              >
                Post your link — go Pro
              </Link>
            </div>
            <form
              className="mx-auto mt-8 flex max-w-xl gap-2 lg:mx-0"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <label className="sr-only" htmlFor="home-search">Search deals</label>
              <input
                id="home-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search deals — try “bank”, “crypto”, “VPN”…"
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-gold/30 focus:ring"
              />
              <button type="submit" className="shrink-0 rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/10">
                Search
              </button>
            </form>
          </div>

          {/* ===== Featured #1: Muse (owner's invite) ===== */}
          <div className="relative rounded-3xl border border-gold/50 bg-black/70 p-6 shadow-gold backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-black">
                ★ Featured #1
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Owner's pick</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold text-white">Muse</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              The AI that builds, writes, researches and runs your projects for you. Join Muse with
              the owner's invite and <span className="font-semibold text-gold">both sides earn bonus
              tokens</span> — you start ahead, the owner earns too. Exactly how every deal on this
              site works.
            </p>
            <a
              href={MUSE_INVITE_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-95"
            >
              Join Muse with the invite →
            </a>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-white/45">
              This is the site owner's invite link — the owner earns bonus tokens when you join.
              Full details on our <Link to="/disclosure" className="underline hover:text-gold">disclosure page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ================= HONEY SPOTLIGHT ================= */}
      <section className="mt-8 flex flex-col items-center gap-5 rounded-3xl border border-gold/25 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 px-6 py-6 md:flex-row md:px-10">
        <img
          src="https://www.google.com/s2/favicons?domain=joinhoney.com&sz=256"
          alt="Honey"
          className="h-16 w-16 rounded-2xl bg-white/95 object-contain p-2"
          loading="lazy"
          decoding="async"
        />
        <div className="flex-1 text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Owner's personal pick</div>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">Honey — automatic coupons &amp; rewards</h2>
          <p className="mt-1 text-sm text-white/70">
            Join Honey with the owner's personal referral link and earn rewards while it hunts coupon
            codes for you at checkout. The owner earns Gold when you join — that's the deal, stated plainly.
          </p>
        </div>
        <a
          href={honey?.url ?? HONEY_REF_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="shrink-0 rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-7 py-3.5 text-sm font-bold text-black shadow-gold transition hover:brightness-110 active:scale-95"
        >
          Join Honey — it's free →
        </a>
      </section>

      {/* ================= SOFI CRYPTO SPOTLIGHT ================= */}
      <section className="mt-8 flex flex-col items-center gap-5 rounded-3xl border border-gold/25 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 px-6 py-6 md:flex-row md:px-10">
        <img
          src="https://www.google.com/s2/favicons?domain=sofi.com&sz=256"
          alt="SoFi"
          className="h-16 w-16 rounded-2xl bg-white/95 object-contain p-2"
          loading="lazy"
          decoding="async"
        />
        <div className="flex-1 text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Owner's crypto pick</div>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">SoFi Crypto — get $25 in SOFID</h2>
          <p className="mt-1 text-sm text-white/70">
            Open a SoFi Crypto account through the owner's invite link and make a purchase of $25 or
            more within 30 days, and <span className="font-semibold text-white">you get $25 in SOFID</span> —
            the owner gets $50 in SOFID. Terms apply. This is the owner's personal invite link,
            labeled like every owner link on this site.
          </p>
          <Link to="/browse?cat=crypto" className="mt-2 inline-block text-xs font-semibold text-gold hover:text-white">
            See all crypto deals →
          </Link>
        </div>
        <a
          href={SOFI_CRYPTO_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="shrink-0 rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-7 py-3.5 text-sm font-bold text-black shadow-gold transition hover:brightness-110 active:scale-95"
        >
          Get $25 in SOFID →
        </a>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mt-16 acss-reveal" aria-label="How it works">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">How it works</div>
          <h2 className="mt-2 font-display text-3xl font-bold text-white">Three steps. Both sides get paid.</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { step: "1", icon: "👆", title: "Pick a deal", desc: "Browse the catalog — banks, apps, tools, shopping. Every deal states what you get for signing up." },
            { step: "2", icon: "✍️", title: "Sign up through the link", desc: "The link carries the poster's referral credit. Sign up on the company's own site — we never see your password or your money." },
            { step: "3", icon: "💰", title: "You earn — poster earns", desc: "Complete the program's steps and the company pays your bonus and the poster's credit. Want your links here? Go Pro and post them." },
          ].map((s) => (
            <div key={s.step} className="glass relative overflow-hidden rounded-3xl border border-white/8 p-8 text-center">
              <div className="pointer-events-none absolute right-4 top-4 font-display text-4xl font-extrabold text-white/5 select-none">0{s.step}</div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-2xl">{s.icon}</div>
              <h3 className="mt-5 font-display text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TRENDING ================= */}
      <section className="mt-16 space-y-6 acss-reveal">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Trending now</div>
            <h2 className="font-display text-3xl font-bold text-white">Deals people are grabbing</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">Ranked by real votes and clicks from visitors.</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-gold hover:text-white">View all deals →</Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {trending.map((r, i) => (
            <ReferralCard key={r.id} referral={r} index={i} variant="trending" />
          ))}
        </div>
      </section>

      <div className="mt-12 lg:hidden">
        <AdSlot variant="banner" />
      </div>

      {/* ================= CATEGORIES ================= */}
      <section className="mt-16">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Categories</div>
          <h2 className="font-display text-3xl font-bold text-white">Pick your money lane</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const v = videoForCategory(c.id);
            return (
              <Link
                key={c.id}
                to={`/browse?cat=${c.id}`}
                className="glass group relative overflow-hidden rounded-3xl border border-white/10 p-6 transition hover:border-gold/40"
              >
                {v ? (
                  <div className="relative -m-6 mb-4 h-32 overflow-hidden">
                    <HoverVideo video={v} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="text-3xl">{c.icon}</div>
                <div className="mt-3 font-display text-xl font-semibold text-white group-hover:text-gold">{c.name}</div>
                <p className="mt-2 text-sm text-muted">{c.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= FEED ================= */}
      <section className="mt-16">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">All deals</div>
          <h2 className="font-display text-3xl font-bold text-white">The full catalog</h2>
          <p className="mt-2 text-sm text-muted">Every listing links to the program's official page. Terms live there — check them before you sign up.</p>
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
              className="rounded-2xl border border-white/10 px-8 py-3 text-sm font-semibold text-white hover:border-gold/40"
            >
              Load more deals
            </button>
          </div>
        ) : null}
      </section>

      {/* ================= PRO STRIP ================= */}
      <section className="mt-16 rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/12 via-transparent to-gold/5 px-6 py-10 text-center md:px-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">For posters</div>
        <h2 className="mt-2 font-display text-3xl font-bold text-white">Your links could be on this page</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
          Browsing is free forever. To <span className="font-semibold text-white">post your own referral links</span> where
          thousands of deal-hunters can click them — and pin up to 2 featured placements on this
          homepage — you need a free account plus <span className="font-semibold text-gold">Pro</span>.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/premium" className="rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-8 py-4 text-sm font-bold text-black shadow-gold transition hover:brightness-110 active:scale-95">
            See Pro — post your links →
          </Link>
          <Link to="/register" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-semibold text-white transition hover:border-gold/40">
            Create free account
          </Link>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="mt-16" aria-label="Frequently asked questions">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Straight answers</div>
          <h2 className="font-display text-3xl font-bold text-white">Questions everyone asks</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="glass group rounded-2xl border border-white/10 px-6 py-4">
              <summary className="cursor-pointer list-none font-semibold text-white marker:hidden hover:text-gold">
                {f.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <EmailInlineCapture />
      </section>

      <p className="mt-10 text-center text-[11px] leading-relaxed text-muted">
        Disclosure: referrals.live and its members may earn a commission or referral credit when you
        sign up through links on this site — at no extra cost to you.{" "}
        <Link to="/disclosure" className="underline hover:text-gold">Read the full disclosure</Link>.
      </p>
    </div>
  );
}
