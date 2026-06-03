import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { sortByTrending } from "@/lib/trending";

export function Ticker() {
  const referrals = useAppStore((s) => s.referrals);
  const items = useMemo(() => sortByTrending(referrals).slice(0, 14), [referrals]);
  const line = useMemo(() => {
    if (!items.length) return "Real referral rankings update as members submit, vote, and click offers.";
    return items
      .map((r, i) => `#${i + 1} ${r.title}  ${r.votes.toLocaleString()} votes  ${r.clicks.toLocaleString()} clicks`)
      .join("          ◆          ");
  }, [items]);

  return (
    <div className="relative border-b border-white/5 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_0%_50%,rgba(0,255,136,0.04),transparent)]" />
      <div className="mx-auto flex max-w-7xl items-center gap-0 px-0 py-2.5 text-[10px] uppercase tracking-[0.2em]">
        {/* Label chip */}
        <div className="shrink-0 flex items-center gap-1.5 border-r border-white/8 bg-neon/8 px-4 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-neon animate-glow-pulse" />
          <span className="font-bold text-neon whitespace-nowrap">Trending</span>
        </div>
        {/* Scrolling text */}
        <div className="relative flex-1 overflow-hidden px-4">
          <div className="animate-ticker whitespace-nowrap text-white/45 font-medium">
            <span className="inline-block pr-20">{line}</span>
            <span className="inline-block pr-20">{line}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
