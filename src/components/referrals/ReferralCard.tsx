import { motion } from "framer-motion";
import { useState } from "react";
import { TiltCard } from "@/components/effects/TiltCard";
import { useAppStore } from "@/store/useAppStore";
import { trackOutboundClick, trackVote } from "@/lib/analytics";
import { ShareButtons } from "@/components/social/ShareButtons";
import clsx from "clsx";
import type { Referral } from "@/store/useAppStore";

type Props = { referral: Referral; index?: number; variant?: "default" | "trending" };

export function ReferralCard({ referral, index = 0, variant = "default" }: Props) {
  const upvote = useAppStore((s) => s.upvote);
  const track = useAppStore((s) => s.trackClick);
  const votedIds = useAppStore((s) => s.votedIds);
  const voted = Boolean(votedIds[referral.id]);
  const [copied, setCopied] = useState(false);

  const onVisit = () => {
    track(referral.id);
    trackOutboundClick(referral.id, referral.url);
    window.open(`/offer/${referral.id}`, "_blank", "noopener,noreferrer");
  };

  const onVote = async () => {
    await upvote(referral.id);
    trackVote(referral.id);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referral.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const verified = referral.votes >= 25 || referral.clicks >= 150 || referral.source === "automation";
  const isTrending = variant === "trending";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full"
    >
      <TiltCard
        className={clsx(
          "group glass card-shell h-full",
          "border transition-colors duration-300",
          isTrending
            ? "border-neon/15 ring-1 ring-neon/10"
            : "border-white/7",
        )}
      >
        {/* Aurora depth layer */}
        <div className="card-aurora pointer-events-none absolute inset-0" />
        <div className="card-perimeter pointer-events-none absolute inset-0 rounded-3xl" />

        {/* Image with overlay gradient */}
        <div className="relative overflow-hidden">
          <div
            className={clsx(
              "relative overflow-hidden",
              isTrending ? "h-52" : "h-44",
            )}
          >
            <img
              src={referral.image}
              alt={referral.title}
              className="h-full w-full bg-white/95 object-contain p-8 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {/* Bottom gradient fade for depth */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(3,4,9,0.85)] to-transparent" />
          </div>

          {/* Trending rank badge */}
          {isTrending && index < 3 ? (
            <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm border border-neon/30 text-[11px] font-bold text-neon">
              #{index + 1}
            </div>
          ) : null}

          {/* Verified badge in image overlay */}
          {verified ? (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-neon/30 bg-black/70 px-2 py-0.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-neon animate-glow-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neon">Verified</span>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="relative z-[2] space-y-3.5 p-5">
          <div>
            <h3 className={clsx(
              "font-display font-semibold leading-snug text-white",
              isTrending ? "text-xl" : "text-[1.05rem]",
            )}>
              {referral.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
              {referral.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {referral.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-neon/15 bg-neon/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-neon/80"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
            <span className="rounded-md border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-white/60">
              {referral.category}
            </span>
            <span className="flex items-center gap-1 text-electric/80">
              <span className="text-[10px]">▲</span>
              {referral.votes.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-white/50">
              <span className="text-[10px]">🔗</span>
              {referral.clicks.toLocaleString()}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-0.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onVisit}
              className={clsx(
                "flex-1 rounded-2xl bg-gradient-to-r from-neon to-emerald-400",
                "font-semibold text-black shadow-neon transition",
                "hover:brightness-110 hover:shadow-[0_0_18px_rgba(0,255,136,0.55)] active:scale-95",
                isTrending ? "px-5 py-3.5 text-[15px]" : "px-4 py-3 text-sm",
              )}
            >
              Get offer
            </button>
            <button
              type="button"
              onClick={onVote}
              disabled={voted}
              className={clsx(
                "rounded-2xl border px-4 py-3 text-sm font-semibold transition active:scale-95",
                voted
                  ? "border-neon/20 bg-neon/5 text-neon/50 cursor-default"
                  : "border-white/10 text-white/80 hover:border-electric/50 hover:text-electric hover:bg-electric/5",
              )}
            >
              {voted ? "✓ Voted" : "Upvote"}
            </button>
            <button
              type="button"
              onClick={copy}
              className={clsx(
                "rounded-2xl border px-4 py-3 text-sm font-semibold transition active:scale-95",
                copied
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-gold/20 text-gold/70 hover:border-gold/50 hover:text-gold hover:bg-gold/5",
              )}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              type="button"
              className="rounded-full border border-gold/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/70 transition hover:border-gold/50 hover:bg-gold/8 hover:text-gold"
            >
              ⚡ Boost
            </button>
            <a
              href={`/program/${referral.id}`}
              className="rounded-full border border-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 transition hover:border-electric/30 hover:text-electric/80"
            >
              Program page →
            </a>
          </div>

          <ShareButtons referralId={referral.id} title={referral.title} url={referral.url} />
        </div>
      </TiltCard>
    </motion.article>
  );
}
