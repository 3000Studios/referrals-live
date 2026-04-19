import clsx from "clsx";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  variant?: "banner" | "rectangle" | "mobile-sticky" | "in-feed";
  className?: string;
  label?: string;
};

const client = "ca-pub-5800977493749262";

/** Set VITE_ADSENSE_SLOT_* in Cloudflare Pages env after creating ad units in AdSense. */
const slots: Record<NonNullable<Props["variant"]>, string | undefined> = {
  banner: import.meta.env.VITE_ADSENSE_SLOT_BANNER,
  rectangle: import.meta.env.VITE_ADSENSE_SLOT_RECT,
  "mobile-sticky": import.meta.env.VITE_ADSENSE_SLOT_MOBILE,
  "in-feed": import.meta.env.VITE_ADSENSE_SLOT_FEED,
};

export function AdSlot({ variant = "banner", className, label = "Advertisement" }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const slot = slots[variant];
  if (!slot) return null;

  useEffect(() => {
    if (!ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [slot, variant]);

  const heights: Record<typeof variant, string> = {
    banner: "min-h-[90px] md:min-h-[100px]",
    rectangle: "min-h-[250px]",
    "mobile-sticky": "min-h-[60px]",
    "in-feed": "min-h-[120px]",
  };

  return (
    <aside
      className={clsx(
        "glass neon-ring relative overflow-hidden rounded-2xl",
        heights[variant],
        variant === "mobile-sticky" && "fixed bottom-3 left-3 right-3 z-40 md:hidden",
        className,
      )}
      aria-label={label}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>{label}</span>
        <span className="text-neon/80">AdSense</span>
      </div>
      <div className="p-3">
        <ins
          ref={ref as never}
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
