import { trackShare } from "@/lib/analytics";
import clsx from "clsx";

type Props = {
  title: string;
  url: string;
  referralId?: string;
  className?: string;
};

export function ShareButtons({ title, url, referralId, className }: Props) {
  const encoded = encodeURIComponent(url);
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encoded}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
  const reddit = `https://www.reddit.com/submit?url=${encoded}&title=${encodeURIComponent(title)}`;

  const go = (channel: string, href: string) => {
    trackShare(channel, referralId);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {[
        { label: "X", channel: "twitter", href: tweet },
        { label: "LinkedIn", channel: "linkedin", href: linkedin },
        { label: "Reddit", channel: "reddit", href: reddit },
      ].map((b) => (
        <button
          key={b.channel}
          type="button"
          onClick={() => go(b.channel, b.href)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90 hover:border-neon/40"
        >
          Share {b.label}
        </button>
      ))}
    </div>
  );
}
