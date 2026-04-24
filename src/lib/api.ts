export type ApiUser = { id: string; email: string; displayName: string; premium: boolean; isAdmin?: boolean; avatar?: string | null; color?: string | null };
export type BillingStatus = {
  premium: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: number;
  activeUntil: number;
};
export type ApiReferral = {
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
  source?: string;
};

export type ApiBlogVideo = { src: string; label: string; attributionLabel: string; attributionHref: string };
export type ApiBlogListItem = {
  slug: string;
  title: string;
  excerpt: string;
  keywords: string[];
  video: ApiBlogVideo | null;
  publishedAt: number;
};
export type ApiBlogPost = ApiBlogListItem & { contentMd: string };

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}

export const api = {
  me: () => apiFetch<{ ok: true; user: ApiUser | null }>("/api/me"),
  login: (email: string, password: string) => apiFetch<{ ok: true; user: ApiUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, displayName: string) =>
    apiFetch<{ ok: true; user: ApiUser }>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) }),
  logout: () => apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  publicReferrals: () => apiFetch<{ ok: true; referrals: ApiReferral[] }>("/api/referrals"),
  searchDiscovery: (query: string, category = "all") =>
    apiFetch<{ ok: true; results: ApiReferral[] }>(
      `/api/discovery/search?q=${encodeURIComponent(query)}&cat=${encodeURIComponent(category)}`,
    ),
  myReferrals: () => apiFetch<{ ok: true; referrals: any[] }>("/api/my/referrals"),
  createReferral: (input: { title: string; description: string; url: string; category: string; tags: string[]; imageUrl: string; status?: "private" | "public_candidate" }) =>
    apiFetch<{ ok: true; referral: { id: string } }>("/api/referrals", { method: "POST", body: JSON.stringify(input) }),
  vote: (id: string) => apiFetch<{ ok: true }>(`/api/referrals/${id}/vote`, { method: "POST" }),
  share: (id: string, channel: string) => apiFetch<{ ok: true }>(`/api/referrals/${id}/share`, { method: "POST", body: JSON.stringify({ channel }) }),

  featured: () => apiFetch<{ ok: true; slots: Array<{ slot: number; referralId: string; startsAt: number; endsAt: number }> }>("/api/my/featured"),
  setFeatured: (slot: 1 | 2, referralId: string) =>
    apiFetch<{ ok: true }>("/api/my/featured", { method: "POST", body: JSON.stringify({ slot, referralId }) }),
  billingStatus: () => apiFetch<{ ok: true; billing: BillingStatus }>("/api/billing/status"),
  saveProfile: (input: { displayName?: string; avatar?: string; color?: string }) =>
    apiFetch<{ ok: true }>("/api/my/profile", { method: "POST", body: JSON.stringify(input) }),
  profileOptions: () => apiFetch<{ ok: true; profile: { displayName?: string; avatar?: string | null; color?: string | null }; allowed: { avatars: string[]; colors: string[] } }>("/api/my/profile"),

  emailCapture: (email: string, source: string) =>
    apiFetch<{ ok: true }>("/api/email-capture", { method: "POST", body: JSON.stringify({ email, source }) }),

  blogList: () => apiFetch<{ ok: true; posts: ApiBlogListItem[] }>("/api/blog"),
  blogPost: (slug: string) => apiFetch<{ ok: true; post: ApiBlogPost }>(`/api/blog/${encodeURIComponent(slug)}`),

  chatWsUrl: () => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//referrals-live-ingest.mr-jwswain.workers.dev/chat/ws`;
  },
};
