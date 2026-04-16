import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { sortByTrending } from "@/lib/trending";

export function Ticker() {
  const referrals = useAppStore((s) => s.referrals);
  const items = useMemo(() => sortByTrending(referrals).slice(0, 14), [referrals]);
  const line = useMemo(
    () =>
      items
        .map((r) => `${r.title} · +${r.votes} votes · ${r.category}`)
        .join("          •          "),
    [items],
  );

  return (
    <div className="border-b border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted">
        <span className="whitespace-nowrap text-neon">Trending</span>
        <div className="relative w-full overflow-hidden">
          <div className="animate-ticker whitespace-nowrap text-white/80">
            <span className="inline-block pr-16">{line}</span>
            <span className="inline-block pr-16">{line}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
