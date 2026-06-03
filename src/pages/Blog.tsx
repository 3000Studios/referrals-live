import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { blogArticles } from "@/data/blogArticles";
import { api } from "@/lib/api";
import { AdSlot } from "@/components/monetization/AdSlot";
import { Fragment, useEffect, useMemo, useState } from "react";

export function Blog() {
  const [remote, setRemote] = useState<Array<{ slug: string; title: string; excerpt: string; keywords: string[]; publishedAt: number }> | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .blogList()
      .then((r) => {
        if (!alive) return;
        setRemote(r.posts ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setRemote([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const ordered = useMemo(() => {
    // Merge DB-backed posts with the bundled evergreen library so every article
    // stays navigable regardless of database state (matters for SEO + AdSense review).
    const staticPosts = blogArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      keywords: a.keywords,
      publishedAt: Date.parse(a.date),
    }));
    const bySlug = new Map<string, { slug: string; title: string; excerpt: string; keywords: string[]; publishedAt: number }>();
    for (const p of staticPosts) bySlug.set(p.slug, p);
    for (const p of remote ?? []) bySlug.set(p.slug, p); // remote wins on slug collisions
    return [...bySlug.values()].sort((a, b) => Number(b.publishedAt) - Number(a.publishedAt));
  }, [remote]);

  return (
    <div>
      <Seo
        title="Referral marketing blog — referrals.live"
        description="SEO-first guides on referral programs, affiliate strategy, passive income systems, and conversion-focused publishing."
        path="/blog"
      />
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neon/80">SEO engine</div>
      <h1 className="font-display text-4xl font-extrabold text-white md:text-5xl">Blog</h1>
      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted">
        SEO-first guides on referral programs, affiliate strategy, passive income systems, and conversion-focused publishing.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {ordered.map((a, idx) => (
          <Fragment key={a.slug}>
            {idx === 4 ? <AdSlot variant="in-feed" className="md:col-span-2" /> : null}
            <Link
              to={`/blog/${a.slug}`}
              className="glass group relative overflow-hidden rounded-3xl border border-white/7 p-6 transition-all duration-300 hover:border-neon/30 hover:[box-shadow:0_0_30px_rgba(0,255,136,0.06)]"
            >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-bold text-white/60">
                {idx + 1}
              </span>
              <time dateTime={new Date(a.publishedAt).toISOString().slice(0, 10)} className="text-white/35">
                {new Date(a.publishedAt).toISOString().slice(0, 10)}
              </time>
            </div>
            <div className="mt-3 font-display text-[1.1rem] font-bold leading-snug text-white/90 group-hover:text-white transition-colors">
              {a.title}
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted line-clamp-2">{a.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {a.keywords.slice(0, 4).map((k) => (
                <span key={k} className="rounded-full border border-neon/15 bg-neon/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neon/70">
                  {k}
                </span>
              ))}
            </div>
            <div className="mt-4 text-[11px] font-semibold text-electric/60 group-hover:text-electric transition-colors">
              Read article →
            </div>
            </Link>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
