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
    const text = referral.url;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const verified = referral.votes >= 25 || referral.clicks >= 150 || referral.source === "automation";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="h-full"
    >
      <TiltCard className={clsx("group glass card-shell h-full border border-white/10", variant === "trending" && "ring-1 ring-neon/20")}>
        <div className="card-aurora pointer-events-none absolute inset-0" />
        <div className="card-perimeter pointer-events-none absolute inset-0 rounded-3xl" />
        <div className="relative overflow-hidden">
          <img
            src={referral.image}
            alt=""
            className={clsx("w-full object-cover", variant === "trending" ? "h-56" : "h-44")}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="relative z-[2] space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={clsx("font-display font-semibold text-white", variant === "trending" ? "text-xl" : "text-lg")}>{referral.title}</h3>
                {verified ? (
                  <span className="rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neon">
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-3 text-sm text-muted">{referral.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {referral.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-neon/90">
                #{t}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-white/5 px-2 py-1">{referral.category}</span>
            <span>⬆ {referral.votes.toLocaleString()}</span>
            <span>🔗 {referral.clicks.toLocaleString()} clicks</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onVisit}
              className={clsx(
                "flex-1 rounded-2xl bg-gradient-to-r from-neon to-emerald-400 text-sm font-semibold text-black shadow-neon transition hover:brightness-110",
                variant === "trending" ? "px-5 py-4 text-base" : "px-4 py-3",
              )}
            >
              Get offer
            </button>
            <button
              type="button"
              onClick={onVote}
              disabled={voted}
              className={clsx(
                "rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold transition",
                voted ? "text-muted" : "text-white hover:border-neon/50",
              )}
            >
              {voted ? "Upvoted" : "Upvote"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="rounded-2xl border border-gold/30 px-4 py-3 text-sm font-semibold text-gold hover:border-gold"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-gold/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
            >
              Boost my link
            </button>
            <a
              href={`/program/${referral.id}`}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 hover:border-neon/30"
            >
              Program page
            </a>
          </div>
          <ShareButtons referralId={referral.id} title={referral.title} url={referral.url} />
        </div>
      </TiltCard>
    </motion.article>
  );
}
