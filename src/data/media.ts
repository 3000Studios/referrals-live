/**
 * Verified stock video for the rebuild (Coverr direct files).
 * Every video URL below was GET-verified live 2026-10-18 (HTTP 200,
 * video/mp4) — see ~/workspace/referrals-rebuild/STOCK-VIDEOS.md.
 * NOTE: do NOT HEAD-check cdn.coverr.co — HEAD 301s to the homepage;
 * that is a CDN quirk, not a dead file. Verify with GET.
 * Poster images are Unsplash files verified live the same day.
 * Videos are decorative: always muted/loop/playsInline, always with a
 * poster fallback, and card videos load ONLY on hover/intent.
 */
export type StockVideo = { src: string; poster: string };

const uimg = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

/** Hero: money falling / people earning — Coverr "Falling Coins". */
export const HERO_VIDEO: StockVideo = {
  src: "https://cdn.coverr.co/videos/coverr-falling-coins-6164/360p.mp4",
  poster: uimg("photo-1557804506-669a67965ba0"),
};

/** Per-category hover loops for offer + category cards. */
export const CATEGORY_VIDEOS: Record<string, StockVideo> = {
  fintech: {
    src: "https://cdn.coverr.co/videos/coverr-a-man-counting-money-9403/360p.mp4",
    poster: uimg("photo-1554224155-6726b3ff858f"),
  },
  crypto: {
    src: "https://cdn.coverr.co/videos/coverr-many-old-coins-fall-on-a-heap-4647/360p.mp4",
    poster: uimg("photo-1518546305927-5a555bb7020d"),
  },
  saas: {
    src: "https://cdn.coverr.co/videos/coverr-student-typing-on-her-laptop-8175/360p.mp4",
    poster: uimg("photo-1519389950473-47ba0277781c"),
  },
  ai: {
    src: "https://cdn.coverr.co/videos/coverr-sketching-a-3d-rectangle-547/360p.mp4",
    poster: uimg("photo-1677442136019-21780ecad995"),
  },
  travel: {
    src: "https://cdn.coverr.co/videos/coverr-airplane-in-the-sky-187/360p.mp4",
    poster: uimg("photo-1436491865332-7a61a109cc05"),
  },
  ecommerce: {
    src: "https://cdn.coverr.co/videos/coverr-online-shopping-with-credit-card/360p.mp4",
    poster: uimg("photo-1472851294608-062f824d29cc"),
  },
};

export function videoForCategory(category: string): StockVideo | null {
  return CATEGORY_VIDEOS[category] ?? null;
}
