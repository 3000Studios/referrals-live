/**
 * Verified stock video for the rebuild (Coverr/Pexels direct files).
 * Every URL in this file was fetch-verified live (HTTP 200, video content
 * type) before being added — see ~/workspace/referrals-rebuild/STOCK-VIDEOS.md.
 * Videos are decorative: always muted/loop/playsInline, always with a
 * poster fallback, and card videos load ONLY on hover/intent.
 */
export type StockVideo = { src: string; poster: string };

/** Hero: people making money / celebrating earnings. */
export const HERO_VIDEO: StockVideo | null = null;

/** Per-category hover loops for offer + category cards. */
export const CATEGORY_VIDEOS: Record<string, StockVideo> = {};

export function videoForCategory(category: string): StockVideo | null {
  return CATEGORY_VIDEOS[category] ?? null;
}
