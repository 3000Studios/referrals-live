export type Referral = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  image: string;
  votes: number;
  clicks: number;
  createdAt: number;
  authorId?: string;
  authorName?: string;
  sponsored?: boolean;
  boosted?: boolean;
  providerId?: string;
  sourceUrl?: string;
  canonicalKey?: string;
  expiresAt?: number;
  qualityScore?: number;
  visibility?: "public" | "forum" | "private";
};

export type ProviderStatus = "active" | "paused";

export type Provider = {
  id: string;
  name: string;
  domain: string;
  attributionTemplate: string;
  requiredParams: string[];
  status: ProviderStatus;
};

export type OwnerReferralProfile = {
  providerId: string;
  // Stored obfuscated for local demo persistence.
  encryptedParams: Record<string, string>;
  updatedBy: string;
  updatedAt: number;
};

export type CuratedReferralStatus = "ready" | "needs_owner_config" | "quarantined";

export type CuratedReferral = {
  id: string;
  sourceUrl: string;
  canonicalKey: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  image: string;
  payoutMeta?: string;
  expiresAt?: number;
  qualityScore: number;
  attributedUrl: string;
  providerId: string;
  status: CuratedReferralStatus;
  createdAt: number;
  votes: number;
  clicks: number;
  sponsored?: boolean;
  boosted?: boolean;
};

export type IngestionRun = {
  runId: string;
  source: string;
  startedAt: number;
  finishedAt: number;
  fetchedCount: number;
  acceptedCount: number;
  errors: string[];
  quarantinedCount: number;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  points: number;
  rank: number;
  premium: boolean;
  isAdmin?: boolean;
  badges: string[];
  createdAt: number;
};

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  keywords: string[];
  sections: { heading: string; body: string[] }[];
  embeds?: { label: string; href: string }[];
};
