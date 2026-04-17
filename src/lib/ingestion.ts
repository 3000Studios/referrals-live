import type { CuratedReferral, Referral } from "@/types";
import { curatedImage } from "@/lib/media";

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function hashKey(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export type IngestionCandidate = {
  source: string;
  title: string;
  description: string;
  sourceUrl: string;
  category: string;
  tags: string[];
  payoutMeta?: string;
  expiresAt?: number;
};

const sampleCandidates: IngestionCandidate[] = [
  {
    source: "mock-crawler",
    title: "FlashBonus Wallet — Spring Referral Multiplier",
    description: "High-converting digital wallet campaign with a temporary multiplier for referred signups.",
    sourceUrl: "https://example.com/flashbonus-wallet",
    category: "fintech",
    tags: ["wallet", "bonus", "signup"],
    payoutMeta: "up to $120",
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14,
  },
  {
    source: "mock-crawler",
    title: "SprintTrader — Weekend Fee Rebate Referrals",
    description: "Trade platform rebate event with elevated commissions for active referred accounts.",
    sourceUrl: "https://example.com/sprinttrader-rebate",
    category: "crypto",
    tags: ["rebate", "trading", "commission"],
    payoutMeta: "up to 40% rev-share",
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 10,
  },
];

export function canonicalKeyForCandidate(candidate: IngestionCandidate) {
  const stable = `${new URL(candidate.sourceUrl).hostname}:${candidate.title.toLowerCase()}:${candidate.category}`;
  return `can-${hashKey(stable)}`;
}

export function scoreCandidate(candidate: IngestionCandidate) {
  const payoutWeight = candidate.payoutMeta ? Math.min(40, candidate.payoutMeta.length) : 8;
  const tagWeight = Math.min(30, candidate.tags.length * 7);
  const freshness = candidate.expiresAt ? 30 : 15;
  return payoutWeight + tagWeight + freshness;
}

export function gatherCandidates() {
  return sampleCandidates;
}

export function toCuratedReferral(
  candidate: IngestionCandidate,
  attributedUrl: string,
  providerId: string,
  status: CuratedReferral["status"],
): CuratedReferral {
  const qualityScore = scoreCandidate(candidate);
  return {
    id: uid("curated"),
    sourceUrl: candidate.sourceUrl,
    canonicalKey: canonicalKeyForCandidate(candidate),
    title: candidate.title,
    description: candidate.description,
    category: candidate.category,
    tags: candidate.tags,
    image: curatedImage("1557804506-669a67965ba0"),
    payoutMeta: candidate.payoutMeta,
    expiresAt: candidate.expiresAt,
    qualityScore,
    attributedUrl,
    providerId,
    status,
    createdAt: Date.now(),
    votes: Math.max(20, Math.floor(qualityScore * 6)),
    clicks: Math.max(50, Math.floor(qualityScore * 15)),
  };
}

export function curatedToReferral(input: CuratedReferral): Referral {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    url: input.attributedUrl,
    category: input.category,
    tags: input.tags,
    image: input.image,
    votes: input.votes,
    clicks: input.clicks,
    createdAt: input.createdAt,
    sponsored: input.sponsored,
    boosted: input.boosted,
    providerId: input.providerId,
    sourceUrl: input.sourceUrl,
    canonicalKey: input.canonicalKey,
    expiresAt: input.expiresAt,
    qualityScore: input.qualityScore,
    visibility: "public",
  };
}

