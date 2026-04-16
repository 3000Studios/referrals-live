import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { blogArticles } from "@/data/blogArticles";

export function Blog() {
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
        Fifteen long-form articles designed for search intent clusters around referrals and monetization.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {blogArticles.map((a) => (
          <Link
            key={a.slug}
            to={`/blog/${a.slug}`}
            className="glass group rounded-3xl border border-white/10 p-6 transition hover:border-neon/40"
          >
            <div className="text-xs text-muted">{a.date} · {a.readTime}</div>
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
