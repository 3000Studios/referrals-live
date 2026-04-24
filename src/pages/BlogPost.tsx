import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { getArticleBySlug } from "@/data/blogArticles";
import { NotFound } from "@/pages/NotFound";
import { AffiliateBlock } from "@/components/monetization/AffiliateBlock";
import { api, type ApiBlogPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { MarkdownLite } from "@/components/seo/MarkdownLite";

const DEFAULT_ARTICLE_VIDEO = {
  src: "https://cdn.coverr.co/videos/coverr-typing-on-a-laptop-9718/1080p.mp4",
  label: "Auto-play video: typing on a laptop",
  attributionLabel: "Video source: Coverr (free license)",
  attributionHref: "https://coverr.co/",
};

export function BlogPost() {
  const { slug } = useParams();
  const [remote, setRemote] = useState<ApiBlogPost | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    api
      .blogPost(slug)
      .then((r) => {
        if (!alive) return;
        setRemote(r.post);
        setChecked(true);
      })
      .catch(() => {
        if (!alive) return;
        setRemote(null);
        setChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const article = slug ? getArticleBySlug(slug) : undefined;
  const canFallback = Boolean(article);
  if (!slug) return <NotFound />;
  if (!remote && checked && !canFallback) return <NotFound />;

  const title = remote?.title ?? article!.title;
  const excerpt = remote?.excerpt ?? article!.excerpt;
  const keywords = remote?.keywords ?? article!.keywords;
  const publishedAt = remote?.publishedAt ?? Date.parse(article!.date);
  const video = remote?.video ?? article?.video ?? DEFAULT_ARTICLE_VIDEO;
  const embeds = article?.embeds ?? null;

  return (
    <article>
      <Seo
        title={`${title} — referrals.live`}
        description={excerpt}
        path={`/blog/${slug}`}
        article={{
          slug,
          title,
          excerpt,
          date: new Date(publishedAt).toISOString().slice(0, 10),
          readTime: "8 min",
          keywords,
          sections: article?.sections ?? [{ heading: "Read", body: [excerpt] }],
          video: video ?? undefined,
        }}
      />
      <div className="text-xs text-muted">
        <Link to="/blog" className="text-electric hover:text-white">
          ← Back to blog
        </Link>
        <span className="mx-2">·</span>
        {new Date(publishedAt).toISOString().slice(0, 10)}
      </div>
      <h1 className="mt-4 font-display text-4xl font-extrabold text-white md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">{excerpt}</p>

      <figure className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <video
          className="h-auto w-full"
          src={video.src}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          aria-label={video.label}
        />
        <figcaption className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-muted">
          <span>{video.label}</span>
          <a href={video.attributionHref} target="_blank" rel="noreferrer" className="text-electric hover:text-white">
            {video.attributionLabel}
          </a>
        </figcaption>
      </figure>

      <div className="mt-10">
        {remote?.contentMd ? (
          <MarkdownLite content={remote.contentMd} />
        ) : (
          <div className="space-y-10">
            {article!.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-2xl font-bold text-white">{s.heading}</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                  {s.body.map((p, idx) => (
                    <p key={`${s.heading}-${idx}`}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {embeds?.length ? (
        <div className="mt-10 glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Recommended next steps</div>
          <ul className="mt-4 space-y-2 text-sm">
            {embeds.map((e) => (
              <li key={e.href}>
                <a className="text-electric hover:text-white" href={e.href} target="_blank" rel="noreferrer">
                  {e.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AffiliateBlock />
    </article>
  );
}
