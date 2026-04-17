import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CuratedReferral,
  IngestionRun,
  OwnerReferralProfile,
  Provider,
  Referral,
  UserProfile,
} from "@/types";
import { seedReferrals } from "@/data/seedReferrals";
import { defaultProviders } from "@/data/providers";
import { defaultOwnerParams } from "@/lib/ownerAttribution";
import { obfuscateParams, revealParams } from "@/lib/security";
import { buildAttributedUrl, providerForUrl } from "@/lib/attributionService";
import { curatedToReferral, gatherCandidates, toCuratedReferral } from "@/lib/ingestion";

const BADGES = {
  TOP_REFERRER: "Top Referrer",
  VIRAL_LINK: "Viral Link",
  EARLY_USER: "Early User",
} as const;

const STORE_VERSION = 2;
let schedulerId: number | null = null;
const ADMIN_EMAIL = (import.meta.env.VITE_OWNER_ADMIN_EMAIL ?? import.meta.env.VITE_OWNER_EMAIL ?? "").toLowerCase();

function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function maxVotesForUser(referrals: Referral[], userId?: string) {
  if (!userId) return 0;
  const mine = referrals.filter((r) => r.authorId === userId).map((r) => r.votes);
  return mine.length ? Math.max(...mine) : 0;
}

function recomputeBadges(profile: UserProfile, referrals: Referral[]): string[] {
  const badges = new Set<string>(profile.badges);
  if (profile.points >= 500) badges.add(BADGES.TOP_REFERRER);
  const ownedVotes = maxVotesForUser(referrals, profile.id);
  if (ownedVotes >= 800) badges.add(BADGES.VIRAL_LINK);
  const ageDays = (Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24);
  if (ageDays < 21 && profile.points >= 40) badges.add(BADGES.EARLY_USER);
  return [...badges];
}

function defaultUser(): UserProfile {
  return {
    id: uid("user"),
    email: "you@referrals.live",
    displayName: "Creator",
    points: 120,
    rank: 1,
    premium: false,
    isAdmin: false,
    badges: [BADGES.EARLY_USER],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  };
}

function fallbackAttributedUrl(rawUrl: string, params: Record<string, string>) {
  try {
    const url = new URL(rawUrl);
    Object.entries(params).forEach(([k, v]) => {
      if (!v) return;
      url.searchParams.set(k, v);
    });
    url.searchParams.set("utm_source", "referrals_live");
    url.searchParams.set("utm_medium", "curated_public");
    url.searchParams.set("utm_campaign", "owner_attribution");
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function revealProfile(profile?: OwnerReferralProfile) {
  return profile ? revealParams(profile.encryptedParams) : {};
}

function seededCuratedReferrals(
  providers: Provider[],
  profileMap: Record<string, OwnerReferralProfile>,
): CuratedReferral[] {
  return seedReferrals.map((ref) => {
    const provider = providerForUrl(providers, ref.url) ?? providers[0];
    const ownerParams = revealProfile(profileMap[provider.id]);
    const built = buildAttributedUrl(provider, ref.url, ownerParams);
    const status: CuratedReferral["status"] = built.ok ? "ready" : "needs_owner_config";
    return {
      id: `curated-${ref.id}`,
      sourceUrl: ref.url,
      canonicalKey: `${provider.id}:${ref.id}`,
      title: ref.title,
      description: ref.description,
      category: ref.category,
      tags: ref.tags,
      image: ref.image,
      payoutMeta: undefined,
      expiresAt: ref.expiresAt,
      qualityScore: ref.qualityScore ?? Math.max(40, Math.floor((ref.votes + ref.clicks) / 50)),
      attributedUrl: built.ok ? built.url : fallbackAttributedUrl(ref.url, ownerParams),
      providerId: provider.id,
      status,
      createdAt: ref.createdAt,
      votes: ref.votes,
      clicks: ref.clicks,
      sponsored: ref.sponsored,
      boosted: ref.boosted,
    };
  });
}

function toPublicReferrals(curated: CuratedReferral[]) {
  return curated
    .filter((c) => c.status === "ready")
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .map((c) => curatedToReferral(c));
}

type LeaderboardUser = { name: string; points: number; badges: string[] };

type State = {
  schemaVersion: number;
  referrals: Referral[];
  userReferrals: Referral[];
  curatedReferrals: CuratedReferral[];
  providers: Provider[];
  ownerProfiles: Record<string, OwnerReferralProfile>;
  ingestionRuns: IngestionRun[];
  quarantineLog: string[];
  votedIds: Record<string, true>;
  user: UserProfile | null;
  emails: string[];
  sessionVersion: number;
  pulseTick: number;
  register: (email: string, password: string, displayName: string) => void;
  login: (email: string, password: string) => void;
  logout: () => void;
  upgradePremium: () => void;
  addEmailCapture: (email: string) => void;
  submitReferral: (input: Omit<Referral, "id" | "votes" | "clicks" | "createdAt">) => Referral;
  upvote: (id: string) => void;
  trackClick: (id: string) => void;
  boostReferral: (id: string) => void;
  simulateActivity: () => void;
  leaderboardUsers: () => LeaderboardUser[];
  topLinks: () => Referral[];
  saveOwnerProfile: (providerId: string, params: Record<string, string>, updatedBy: string) => void;
  testAttribution: (providerId: string, sourceUrl: string) => { ok: true; url: string } | { ok: false; reason: string };
  runIngestion: (source?: string) => void;
  syncPublicFeed: () => void;
  missingConfigProviders: () => Provider[];
  startIngestionScheduler: () => void;
  stopIngestionScheduler: () => void;
};

const providers = defaultProviders;
const ownerProfiles: Record<string, OwnerReferralProfile> = {
  [providers[0].id]: {
    providerId: providers[0].id,
    encryptedParams: obfuscateParams(defaultOwnerParams),
    updatedBy: "system-bootstrap",
    updatedAt: Date.now(),
  },
};
const bootCurated = seededCuratedReferrals(providers, ownerProfiles);

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      schemaVersion: STORE_VERSION,
      referrals: toPublicReferrals(bootCurated),
      userReferrals: [],
      curatedReferrals: bootCurated,
      providers,
      ownerProfiles,
      ingestionRuns: [],
      quarantineLog: [],
      votedIds: {},
      user: null,
      emails: [],
      sessionVersion: 1,
      pulseTick: 0,

      register: (email, _password, displayName) => {
        const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL && Boolean(ADMIN_EMAIL);
        const profile: UserProfile = {
          id: uid("user"),
          email,
          displayName,
          points: 75,
          rank: 14,
          premium: false,
          isAdmin,
          badges: [BADGES.EARLY_USER],
          createdAt: Date.now(),
        };
        set({ user: profile, sessionVersion: get().sessionVersion + 1 });
      },

      login: (email, _password) => {
        const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL && Boolean(ADMIN_EMAIL);
        const existing = get().user;
        if (existing && existing.email === email) {
          set({ user: { ...existing, isAdmin }, sessionVersion: get().sessionVersion + 1 });
          return;
        }
        set({
          user: {
            ...defaultUser(),
            email,
            displayName: email.split("@")[0] ?? "Operator",
            isAdmin,
          },
          sessionVersion: get().sessionVersion + 1,
        });
      },

      logout: () => set({ user: null, sessionVersion: get().sessionVersion + 1 }),

      upgradePremium: () => {
        const u = get().user;
        if (!u) return;
        set({ user: { ...u, premium: true, points: u.points + 200 } });
      },

      addEmailCapture: (email) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || get().emails.includes(trimmed)) return;
        set({ emails: [...get().emails, trimmed] });
      },

      submitReferral: (input) => {
        const user = get().user;
        // User submissions stay user-owned and are not auto-published to the public crawlable feed.
        const ref: Referral = {
          ...input,
          id: `usr-${uid("ref")}`,
          votes: 1,
          clicks: 0,
          createdAt: Date.now(),
          authorId: user?.id,
          authorName: user?.displayName ?? "Community",
          visibility: "forum",
        };
        const userReferrals = [ref, ...get().userReferrals];
        set({ userReferrals });
        if (user) {
          const points = user.points + 50;
          const nb = recomputeBadges({ ...user, points }, userReferrals);
          set({
            user: {
              ...user,
              points,
              badges: nb,
              rank: Math.max(1, 12 - Math.floor(points / 100)),
            },
          });
        }
        return ref;
      },

      upvote: (id) => {
        if (get().votedIds[id]) return;
        const referrals = get().referrals.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r));
        const curatedReferrals = get().curatedReferrals.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r));
        const user = get().user;
        let nextUser = user;
        if (user) {
          const points = user.points + 5;
          nextUser = {
            ...user,
            points,
            badges: recomputeBadges({ ...user, points }, referrals),
            rank: Math.max(1, 20 - Math.floor(points / 150)),
          };
        }
        set({
          referrals,
          curatedReferrals,
          votedIds: { ...get().votedIds, [id]: true },
          user: nextUser,
        });
      },

      trackClick: (id) => {
        set({
          referrals: get().referrals.map((r) => (r.id === id ? { ...r, clicks: r.clicks + 1 } : r)),
          curatedReferrals: get().curatedReferrals.map((r) => (r.id === id ? { ...r, clicks: r.clicks + 1 } : r)),
        });
        const user = get().user;
        if (user) {
          const points = user.points + 1;
          set({ user: { ...user, points, rank: Math.max(1, 20 - Math.floor(points / 150)) } });
        }
      },

      boostReferral: (id) => {
        set({
          userReferrals: get().userReferrals.map((r) => (r.id === id ? { ...r, boosted: true } : r)),
        });
      },

      simulateActivity: () => {
        const list = get().referrals;
        if (list.length === 0) return;
        const next = [...list];
        for (let i = 0; i < 3; i += 1) {
          const idx = Math.floor(Math.random() * next.length);
          const r = next[idx];
          next[idx] = { ...r, clicks: r.clicks + Math.floor(Math.random() * 4) + 1 };
        }
        set({ referrals: next, pulseTick: get().pulseTick + 1 });
      },

      leaderboardUsers: () => {
        const map = new Map<string, LeaderboardUser>();
        const u = get().user;
        if (u) map.set(u.id, { name: u.displayName, points: u.points, badges: u.badges });
        get().referrals.slice(0, 8).forEach((r, i) => {
          const id = `bot-${i}`;
          if (!map.has(id)) {
            map.set(id, {
              name: r.authorName ?? `Player ${i + 1}`,
              points: 400 + i * 33 + (r.votes % 50),
              badges: i % 2 === 0 ? [BADGES.TOP_REFERRER] : [BADGES.VIRAL_LINK],
            });
          }
        });
        return [...map.values()].sort((a, b) => b.points - a.points).slice(0, 12);
      },

      topLinks: () => [...get().referrals].sort((a, b) => b.votes + b.clicks - (a.votes + a.clicks)).slice(0, 8),

      saveOwnerProfile: (providerId, params, updatedBy) => {
        const existing = get().ownerProfiles;
        const nextProfiles = {
          ...existing,
          [providerId]: {
            providerId,
            encryptedParams: obfuscateParams(params),
            updatedBy,
            updatedAt: Date.now(),
          },
        };
        set({ ownerProfiles: nextProfiles });
        get().syncPublicFeed();
      },

      testAttribution: (providerId, sourceUrl) => {
        const provider = get().providers.find((p) => p.id === providerId);
        if (!provider) return { ok: false as const, reason: "Provider not found" };
        const params = revealProfile(get().ownerProfiles[providerId]);
        const built = buildAttributedUrl(provider, sourceUrl, params);
        if (!built.ok) return { ok: false as const, reason: built.reason };
        return { ok: true as const, url: built.url };
      },

      runIngestion: (source = "scheduled-crawl") => {
        const start = Date.now();
        const errors: string[] = [];
        const quarantine: string[] = [];
        let candidates: ReturnType<typeof gatherCandidates> = [];
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            candidates = gatherCandidates();
            break;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`ingestion attempt ${attempt} failed: ${message}`);
            if (attempt === maxAttempts) {
              const run: IngestionRun = {
                runId: uid("run"),
                source,
                startedAt: start,
                finishedAt: Date.now(),
                fetchedCount: 0,
                acceptedCount: 0,
                errors,
                quarantinedCount: 0,
              };
              set({ ingestionRuns: [run, ...get().ingestionRuns].slice(0, 30) });
              return;
            }
          }
        }
        const providers = get().providers;
        const profiles = get().ownerProfiles;
        const existingByCanonical = new Map(get().curatedReferrals.map((r) => [r.canonicalKey, r]));
        let accepted = 0;

        const generated: CuratedReferral[] = [];
        candidates.forEach((candidate) => {
          try {
            const provider = providerForUrl(providers, candidate.sourceUrl) ?? providers[0];
            const ownerParams = revealProfile(profiles[provider.id]);
            const built = buildAttributedUrl(provider, candidate.sourceUrl, ownerParams);
            const status: CuratedReferral["status"] = built.ok ? "ready" : "needs_owner_config";
            const attributed = built.ok ? built.url : fallbackAttributedUrl(candidate.sourceUrl, ownerParams);
            const normalized = toCuratedReferral(candidate, attributed, provider.id, status);
            if (existingByCanonical.has(normalized.canonicalKey)) return;
            if (normalized.expiresAt && normalized.expiresAt < Date.now()) {
              quarantine.push(`${normalized.title}: expired`);
              return;
            }
            if (!built.ok) errors.push(`${normalized.title}: ${built.reason}`);
            generated.push(normalized);
            if (status === "ready") accepted += 1;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            quarantine.push(`${candidate.title}: ${message}`);
          }
        });

        const merged = [...generated, ...get().curatedReferrals];
        const run: IngestionRun = {
          runId: uid("run"),
          source,
          startedAt: start,
          finishedAt: Date.now(),
          fetchedCount: candidates.length,
          acceptedCount: accepted,
          errors,
          quarantinedCount: quarantine.length,
        };
        set({
          curatedReferrals: merged,
          ingestionRuns: [run, ...get().ingestionRuns].slice(0, 30),
          quarantineLog: [...quarantine, ...get().quarantineLog].slice(0, 120),
        });
        get().syncPublicFeed();
      },

      syncPublicFeed: () => {
        const providers = get().providers;
        const profiles = get().ownerProfiles;
        const now = Date.now();
        const rebuilt = get().curatedReferrals.map((entry) => {
          const provider = providers.find((p) => p.id === entry.providerId) ?? providers[0];
          const ownerParams = revealProfile(profiles[provider.id]);
          const built = buildAttributedUrl(provider, entry.sourceUrl, ownerParams);
          const status: CuratedReferral["status"] =
            built.ok && (!entry.expiresAt || entry.expiresAt >= now) ? "ready" : "needs_owner_config";
          return {
            ...entry,
            attributedUrl: built.ok ? built.url : fallbackAttributedUrl(entry.sourceUrl, ownerParams),
            status,
          };
        });
        set({ curatedReferrals: rebuilt, referrals: toPublicReferrals(rebuilt) });
      },

      missingConfigProviders: () => {
        const providers = get().providers;
        const profiles = get().ownerProfiles;
        return providers.filter((p) => {
          const profile = profiles[p.id];
          const params = revealProfile(profile);
          return p.requiredParams.some((key) => !params[key]?.trim());
        });
      },

      startIngestionScheduler: () => {
        if (schedulerId != null) return;
        schedulerId = window.setInterval(() => {
          get().runIngestion("auto-30m");
        }, 30 * 60 * 1000);
      },

      stopIngestionScheduler: () => {
        if (schedulerId == null) return;
        window.clearInterval(schedulerId);
        schedulerId = null;
      },
    }),
    {
      name: "referrals-live-storage",
      version: STORE_VERSION,
      migrate: (persisted: unknown, version) => {
        if (version >= STORE_VERSION) return persisted as State;
        const p = (persisted as Record<string, unknown>) || {};
        return {
          ...p,
          schemaVersion: STORE_VERSION,
          providers: p.providers ?? providers,
          ownerProfiles: p.ownerProfiles ?? ownerProfiles,
          curatedReferrals: p.curatedReferrals ?? bootCurated,
          referrals: p.referrals ?? toPublicReferrals(bootCurated),
          userReferrals: p.userReferrals ?? [],
          ingestionRuns: p.ingestionRuns ?? [],
          quarantineLog: p.quarantineLog ?? [],
        } as State;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.syncPublicFeed();
      },
    },
  ),
);

export const badgeLabels = BADGES;
