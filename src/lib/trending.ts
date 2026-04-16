import type { Referral } from "@/types";

/** Hot ranking: votes + clicks decay with time (gravity). */
export function trendingScore(r: Referral, now = Date.now()): number {
  const ageHours = Math.max(0.25, (now - r.createdAt) / 3_600_000);
  const gravity = 1.65;
  const signal = r.votes * 2.2 + r.clicks * 0.45 + (r.boosted ? 12 : 0) + (r.sponsored ? 6 : 0);
  return signal / Math.pow(ageHours + 1.5, gravity);
}

export function sortByTrending(list: Referral[]): Referral[] {
  return [...list].sort((a, b) => trendingScore(b) - trendingScore(a));
}

export function sortByNewest(list: Referral[]): Referral[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export function sortByPopular(list: Referral[]): Referral[] {
  return [...list].sort((a, b) => b.votes + b.clicks - (a.votes + a.clicks));
}
