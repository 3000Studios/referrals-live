import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Referral, UserProfile } from "@/types";
import { seedReferrals } from "@/data/seedReferrals";

const BADGES = {
  TOP_REFERRER: "Top Referrer",
  VIRAL_LINK: "Viral Link",
  EARLY_USER: "Early User",
} as const;

function uid() {
  return crypto.randomUUID();
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

type State = {
  referrals: Referral[];
  votedIds: Record<string, true>;
  user: UserProfile | null;
  emails: string[];
  sessionVersion: number;
  /** simulated pulse counter for UI */
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
  leaderboardUsers: () => { name: string; points: number; badges: string[] }[];
  topLinks: () => Referral[];
};

const defaultUser = (): UserProfile => ({
  id: uid(),
  email: "you@referrals.live",
  displayName: "Creator",
  points: 120,
  rank: 1,
  premium: false,
  badges: [BADGES.EARLY_USER],
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
});

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      referrals: seedReferrals,
      votedIds: {},
      user: null,
      emails: [],
      sessionVersion: 1,
      pulseTick: 0,

      register: (email, _password, displayName) => {
        const profile: UserProfile = {
          id: uid(),
          email,
          displayName,
          points: 75,
          rank: 14,
          premium: false,
          badges: [BADGES.EARLY_USER],
          createdAt: Date.now(),
        };
        set({ user: profile, sessionVersion: get().sessionVersion + 1 });
      },

      login: (email, _password) => {
        const existing = get().user;
        if (existing && existing.email === email) {
          set({ sessionVersion: get().sessionVersion + 1 });
          return;
        }
        set({
          user: {
            ...defaultUser(),
            email,
            displayName: email.split("@")[0] ?? "Operator",
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
        const ref: Referral = {
          ...input,
          id: `usr-${uid()}`,
          votes: 1,
          clicks: 0,
          createdAt: Date.now(),
          authorId: user?.id,
          authorName: user?.displayName ?? "Community",
        };
        const referrals = [ref, ...get().referrals];
        set({ referrals });
        if (user) {
          const points = user.points + 50;
          const nb = recomputeBadges({ ...user, points }, referrals);
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
        const referrals = get().referrals.map((r) =>
          r.id === id ? { ...r, votes: r.votes + 1 } : r,
        );
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
          votedIds: { ...get().votedIds, [id]: true },
          user: nextUser,
        });
      },

      trackClick: (id) => {
        set({
          referrals: get().referrals.map((r) => (r.id === id ? { ...r, clicks: r.clicks + 1 } : r)),
        });
        const user = get().user;
        if (user) {
          const points = user.points + 1;
          set({ user: { ...user, points, rank: Math.max(1, 20 - Math.floor(points / 150)) } });
        }
      },

      boostReferral: (id) => {
        set({
          referrals: get().referrals.map((r) => (r.id === id ? { ...r, boosted: true } : r)),
        });
      },

      simulateActivity: () => {
        const list = get().referrals;
        if (list.length === 0) return;
        const next = [...list];
        for (let i = 0; i < 3; i++) {
          const idx = Math.floor(Math.random() * next.length);
          const r = next[idx];
          next[idx] = { ...r, clicks: r.clicks + Math.floor(Math.random() * 4) + 1 };
        }
        set({ referrals: next, pulseTick: get().pulseTick + 1 });
      },

      leaderboardUsers: () => {
        const map = new Map<string, { name: string; points: number; badges: string[] }>();
        const u = get().user;
        if (u) map.set(u.id, { name: u.displayName, points: u.points, badges: u.badges });
        seedReferrals.slice(0, 8).forEach((r, i) => {
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
    }),
    { name: "referrals-live-storage" },
  ),
);

export const badgeLabels = BADGES;
