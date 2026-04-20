import { create } from "zustand";
import type { ApiReferral, ApiUser } from "@/lib/api";
import { api } from "@/lib/api";

export type Referral = ApiReferral;
export type UserProfile = ApiUser;

type State = {
  referrals: Referral[];
  user: UserProfile | null;
  votedIds: Record<string, true>;
  loading: boolean;
  hydrate: () => Promise<void>;
  refreshPublic: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  submitReferral: (input: { title: string; description: string; url: string; category: string; tags: string[]; image: string; wantPublicCandidate?: boolean }) => Promise<{ id: string }>;
  upvote: (id: string) => Promise<void>;
  trackClick: (_id: string) => void;
  addEmailCapture: (email: string, source: string) => Promise<void>;
};

export const useAppStore = create<State>((set, get) => ({
  referrals: [],
  user: null,
  votedIds: {},
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const [me, pub] = await Promise.all([api.me(), api.publicReferrals()]);
      set({ user: me.user, referrals: pub.referrals });
    } finally {
      set({ loading: false });
    }
  },

  refreshPublic: async () => {
    const pub = await api.publicReferrals();
    set({ referrals: pub.referrals });
  },

  login: async (email, password) => {
    const res = await api.login(email, password);
    set({ user: res.user });
  },

  register: async (email, password, displayName) => {
    const res = await api.register(email, password, displayName);
    set({ user: res.user });
  },

  logout: async () => {
    await api.logout();
    set({ user: null, votedIds: {} });
  },

  submitReferral: async (input) => {
    const user = get().user;
    if (!user) throw new Error("Login required");
    const status = input.wantPublicCandidate && user.premium ? "public_candidate" : "private";
    const res = await api.createReferral({
      title: input.title,
      description: input.description,
      url: input.url,
      category: input.category,
      tags: input.tags,
      imageUrl: input.image,
      status,
    });
    return res.referral;
  },

  upvote: async (id) => {
    await api.vote(id);
    set((s) => ({ votedIds: { ...s.votedIds, [id]: true } }));
    await get().refreshPublic();
  },

  trackClick: () => {},
  addEmailCapture: async (email: string, source: string) => {
    await api.emailCapture(email, source);
  },
}));

export const badgeLabels = {
  EARLY_USER: "Early User",
  TOP_REFERRER: "Top Referrer",
  VIRAL_LINK: "Viral Link",
} as const;
