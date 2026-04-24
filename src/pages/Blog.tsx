import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { blogArticles } from "@/data/blogArticles";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

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
    if (remote && remote.length) return [...remote].sort((a, b) => Number(b.publishedAt) - Number(a.publishedAt));
    return [...blogArticles].sort((a, b) => b.date.localeCompare(a.date)).map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      keywords: a.keywords,
      publishedAt: Date.parse(a.date),
    }));
  }, [remote]);

  return (
    <div>
      <Seo
        title="Referral marketing blog — referrals.live"
        description="SEO-first guides on referral programs, affiliate strategy, passive income systems, and conversion-focused publishing."
        path="/blog"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">SEO engine</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Blog</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Daily DRI briefs and SEO-first guides designed for search intent clusters around referrals, monetization, and subscriber growth.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {ordered.map((a, idx) => (
          <Link
            key={a.slug}
            to={`/blog/${a.slug}`}
            className="glass group rounded-3xl border border-white/10 p-6 transition hover:border-neon/40"
          >
            <div className="text-xs text-muted">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/80">
                {idx + 1}
              </span>
              {new Date(a.publishedAt).toISOString().slice(0, 10)}
            </div>
            <div className="mt-3 font-display text-xl font-bold text-white group-hover:text-neon">{a.title}</div>
            <p className="mt-3 text-sm text-muted">{a.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.keywords.slice(0, 4).map((k) => (
                <span key={k} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-neon/90">
                  {k}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
