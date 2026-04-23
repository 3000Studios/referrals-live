import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

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
  pros: string[];
  cons: string[];
  howToJoin: string[];
  reviews: Array<{ author: string; text: string }>;
  related: Array<{ id: string; title: string; category: string }>;
};

export function Program() {
  const { id } = useParams();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error ?? "Failed to load");
        setProgram(data.program);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [id]);

  if (error) {
    return <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">{error}</div>;
  }

  if (!program) {
    return <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-muted">Loading program page…</div>;
  }

  return (
    <div className="space-y-8">
      <Seo title={`${program.title} — referrals.live`} description={program.description} path={`/program/${program.id}`} />
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Program page</div>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-white">{program.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="rounded-full border border-white/10 px-3 py-1">{program.category}</span>
            {program.verified ? <span className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-neon">Verified</span> : null}
            <span>{program.votes} votes</span>
            <span>{program.clicks} clicks</span>
          </div>
          <p className="mt-5 max-w-3xl text-base text-muted">{program.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {program.tags.map((tag) => (
              <Link key={tag} to={`/browse?q=${encodeURIComponent(tag)}`} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 hover:border-neon/30">
                #{tag}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/offer/${program.id}`} className="rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-4 text-sm font-semibold text-black shadow-neon">
              Get offer
            </a>
            <Link to="/premium" className="rounded-2xl border border-gold/40 px-6 py-4 text-sm font-semibold text-gold hover:bg-gold/10">
              Boost or feature this
            </Link>
          </div>
        </div>
        <div className="glass overflow-hidden rounded-3xl border border-white/10">
          <img src={program.image} alt="" className="h-full min-h-[320px] w-full object-cover" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">How to join</div>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            {program.howToJoin.map((step, index) => (
              <li key={step}>
                <span className="mr-2 text-white">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Pros</div>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {program.pros.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Cons</div>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {program.cons.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">User reviews</div>
          <div className="mt-4 space-y-4">
            {program.reviews.map((review) => (
              <div key={`${review.author}-${review.text}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-semibold text-white">{review.author}</div>
                <div className="mt-2 text-sm text-muted">{review.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Related programs</div>
          <div className="mt-4 space-y-3">
            {program.related.map((item) => (
              <Link key={item.id} to={`/program/${item.id}`} className="block rounded-2xl border border-white/10 bg-black/30 p-4 hover:border-neon/30">
                <div className="font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-sm text-muted">{item.category}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
