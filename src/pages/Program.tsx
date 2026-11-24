import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Seo } from "@/components/seo/Seo";
import { TiltCard } from "@/components/effects/TiltCard";
import type { ProgramGuide } from "@/data/programGuideTypes";

type ProgramData = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  image: string;
  createdAt: number;
  votes: number;
  clicks: number;
  verified: boolean;
  owner?: "system" | "member";
  related: Array<{ id: string; title: string; category: string }>;
};

const POSTING_LABEL: Record<ProgramGuide["publicPosting"], { text: string; cls: string }> = {
  allowed: { text: "Public sharing allowed", cls: "border-neon/40 bg-neon/10 text-neon" },
  restricted: { text: "Public sharing restricted", cls: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  unclear: { text: "Public sharing rules unclear", cls: "border-white/20 bg-white/5 text-white/70" },
};

const stripNumber = (s: string) => s.replace(/^\s*\d+[.)]\s*/, "");

function GuideCard({ title, tone, children }: { title: string; tone: "neon" | "gold" | "electric"; children: ReactNode }) {
  const label = tone === "gold" ? "text-gold" : tone === "electric" ? "text-electric" : "text-neon";
  return (
    <TiltCard tone={tone} tilt={5} className="group glass h-full border border-white/10">
      <div className="p-6">
        <h2 className={`text-xs font-semibold uppercase tracking-[0.25em] ${label}`}>{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </TiltCard>
  );
}

export function Program() {
  const { id } = useParams();
  const [program, setProgram] = useState<ProgramData | null>(null);
  // undefined = still loading the guide chunk, null = no guide for this program.
  const [guide, setGuide] = useState<ProgramGuide | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setProgram(null);
    setGuide(undefined);
    setError(null);
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error ?? "Failed to load");
        setProgram(data.program);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    // Guides load as their own chunk, only on program pages.
    import("@/data/programGuides.json")
      .then((m) => {
        const all = (m.default ?? m) as unknown as Record<string, ProgramGuide>;
        setGuide(all[id] ?? null);
      })
      .catch(() => setGuide(null));
  }, [id]);

  if (error) {
    return <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">{error}</div>;
  }

  if (!program) {
    return <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-muted">Loading program page…</div>;
  }

  const posting = guide ? POSTING_LABEL[guide.publicPosting] : null;
  const isMember = program.owner === "member";

  return (
    <div className="space-y-8">
      <Seo
        title={guide ? `${guide.company} referral program: how it pays and how to join — referrals.live` : `${program.title} — referrals.live`}
        description={guide ? guide.summary.slice(0, 158) : program.description}
        path={`/program/${program.id}`}
      />
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">
            {guide ? `${guide.programType} guide` : isMember ? "Member listing" : "Program page"}
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-white">
            {guide ? `${guide.company} referral program` : program.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="rounded-full border border-white/10 px-3 py-1">{program.category}</span>
            {program.verified ? <span className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-neon">Verified</span> : null}
            {posting ? <span className={`rounded-full border px-3 py-1 ${posting.cls}`}>{posting.text}</span> : null}
            <span>{program.votes} votes</span>
            <span>{program.clicks} clicks</span>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/80">{guide ? guide.summary : program.description}</p>
          {guide ? <p className="mt-3 max-w-3xl text-sm text-muted">{guide.whoItsFor}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {program.tags.map((tag) => (
              <Link key={tag} to={`/browse?q=${encodeURIComponent(tag)}`} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 hover:border-neon/30">
                #{tag}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/offer/${program.id}`} className="rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-4 text-sm font-semibold text-black shadow-neon transition hover:brightness-110 active:scale-95">
              Get offer
            </a>
            <Link to="/premium" className="rounded-2xl border border-gold/40 px-6 py-4 text-sm font-semibold text-gold hover:bg-gold/10">
              Post your own link
            </Link>
          </div>
        </motion.div>
        <TiltCard tone="electric" tilt={6} className="group glass border border-white/10">
          <img src={program.image} alt="" className="h-full min-h-[320px] w-full bg-white/95 object-contain p-12" />
        </TiltCard>
      </section>

      {guide ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <GuideCard title="How it pays" tone="gold">
              <ul className="space-y-3 text-sm leading-relaxed text-white/80">
                {guide.howItPays.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-gold">◆</span><span>{item}</span></li>
                ))}
              </ul>
            </GuideCard>
            <GuideCard title="Who qualifies" tone="neon">
              <ul className="space-y-3 text-sm leading-relaxed text-white/80">
                {guide.eligibility.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-neon">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </GuideCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <GuideCard title="How to join and share" tone="electric">
              <ol className="space-y-3 text-sm leading-relaxed text-white/80">
                {guide.steps.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-electric/40 text-[11px] font-bold text-electric">{i + 1}</span>
                    <span>{stripNumber(step)}</span>
                  </li>
                ))}
              </ol>
            </GuideCard>
            <GuideCard title="Tips" tone="neon">
              <ul className="space-y-3 text-sm leading-relaxed text-white/80">
                {guide.tips.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </GuideCard>
            <GuideCard title="Watch out for" tone="gold">
              <ul className="space-y-3 text-sm leading-relaxed text-white/80">
                {guide.watchOuts.map((item) => (
                  <li key={item}>⚠ {item}</li>
                ))}
              </ul>
            </GuideCard>
          </section>

          <section className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Common questions</h2>
            <div className="mt-4 space-y-3">
              {guide.faq.map((f) => (
                <details key={f.q} className="group/faq rounded-2xl border border-white/10 bg-black/30 p-4 transition open:border-electric/30">
                  <summary className="cursor-pointer list-none font-semibold text-white">
                    <span className="mr-2 inline-block text-electric transition-transform group-open/faq:rotate-90">›</span>
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass rounded-3xl border border-white/10 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Sharing rules and sources</h2>
              {posting ? (
                <p className="mt-4 text-sm text-white/80">
                  <span className={`mr-2 rounded-full border px-2 py-0.5 text-[11px] ${posting.cls}`}>{posting.text}</span>
                  {guide.publicPostingNote}
                </p>
              ) : null}
              <p className="mt-4 text-xs text-muted">
                Written by referrals.live from {guide.company}'s own pages, checked Nov 24, 2026. Programs change often, so the
                company's current terms always win.
              </p>
              <ul className="mt-3 space-y-2 text-xs">
                {guide.sources.map((src) => (
                  <li key={src.url}>
                    <a href={src.url} target="_blank" rel="nofollow noopener noreferrer" className="text-electric hover:text-white">
                      {src.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <RelatedPrograms related={program.related} />
          </section>
        </>
      ) : guide === undefined ? (
        <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5" aria-hidden />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Before you join</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>• Read the company's current terms before signing up. Rewards and eligibility change often.</li>
              <li>• Check who counts as a new customer. Many programs exclude existing customers and self-referrals.</li>
              <li>• Note the qualifying steps and deadlines, like a first purchase or deposit within a set window.</li>
              <li>• Keep a record of your signup until any reward arrives. Only the company can credit its own program.</li>
            </ul>
          </div>
          <RelatedPrograms related={program.related} />
        </section>
      )}
    </div>
  );
}

function RelatedPrograms({ related }: { related: ProgramData["related"] }) {
  if (!related.length) return <div />;
  return (
    <div className="glass rounded-3xl border border-white/10 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Related programs</h2>
      <div className="mt-4 space-y-3">
        {related.map((item) => (
          <TiltCard key={item.id} tilt={4} className="group border border-white/10 bg-black/30">
            <Link to={`/program/${item.id}`} className="block p-4">
              <div className="font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-sm text-muted">{item.category}</div>
            </Link>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
