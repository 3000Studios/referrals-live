import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { personalLinks } from "@/data/personalLinks";

/**
 * Hero carousel — the owner's own referral links, generated from
 * src/data/personalLinks.ts. Auto-rotates (pauses on hover/focus and for
 * reduced-motion users). Card sizing follows the ACSS sizing grid's large
 * tier (--wide: 22rem cells) — one large card fills the hero.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);
  const count = personalLinks.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [paused, count]);

  if (count === 0) return null;
  const link = personalLinks[index]!;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="The owner's featured referral links"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        key={link.id}
        className="acss-texture flex min-h-[22rem] flex-col items-center gap-6 overflow-hidden rounded-[2rem] border border-gold/30 px-6 py-10 text-center shadow-gold md:flex-row md:px-12 md:text-left"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${count}: ${link.name}`}
      >
        <img
          src={link.image}
          alt={link.name}
          className="h-24 w-24 shrink-0 rounded-3xl bg-white/95 object-contain p-3"
          loading="eager"
          decoding="async"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              Owner's link
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              {link.categoryLabel}
            </span>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-white md:text-4xl">
            {link.name} — {link.bonus}
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/70 md:mx-0">
            {link.terms}
          </p>
          <p className="mt-2 text-[11px] text-white/40">
            This is the site owner's personal referral link, labeled like every owner link on this
            site. See our <Link to="/disclosure" className="underline hover:text-gold">disclosure</Link>.
          </p>
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="shrink-0 rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-8 py-4 text-sm font-bold text-black shadow-gold transition hover:brightness-110 active:scale-95"
        >
          {link.ctaLabel} →
        </a>
      </div>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous featured link"
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 transition hover:border-gold/50 hover:text-gold"
          >
            ←
          </button>
          {personalLinks.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${l.name}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-8 bg-gold" : "w-2.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next featured link"
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 transition hover:border-gold/50 hover:text-gold"
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
