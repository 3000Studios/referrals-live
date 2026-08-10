import { create } from "zustand";

const STORAGE_KEY = "referrals.live:saved-stack";

export type StackGoal = "first-referral" | "creator" | "cashback" | "business";

type StackState = {
  savedIds: string[];
  goal: StackGoal | null;
  hydrated: boolean;
  hydrate: () => void;
  toggle: (referralId: string) => void;
  setGoal: (goal: StackGoal | null) => void;
  clear: () => void;
};

function persist(savedIds: string[], goal: StackGoal | null) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedIds, goal }));
  } catch {
    // Saving is an enhancement; the marketplace remains usable without storage.
  }
}

export const useReferralStack = create<StackState>((set, get) => ({
  savedIds: [],
  goal: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      const parsed = value ? JSON.parse(value) as { savedIds?: unknown; goal?: unknown } : null;
      const savedIds = Array.isArray(parsed?.savedIds)
        ? parsed.savedIds.filter((id): id is string => typeof id === "string")
        : [];
      const goal = ["first-referral", "creator", "cashback", "business"].includes(String(parsed?.goal))
        ? parsed?.goal as StackGoal
        : null;
      set({ savedIds, goal, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  toggle: (referralId) => {
    const savedIds = get().savedIds.includes(referralId)
      ? get().savedIds.filter((id) => id !== referralId)
      : [...get().savedIds, referralId];
    persist(savedIds, get().goal);
    set({ savedIds });
  },
  setGoal: (goal) => {
    persist(get().savedIds, goal);
    set({ goal });
  },
  clear: () => {
    persist([], get().goal);
    set({ savedIds: [] });
  },
}));
