import { useEffect, useMemo, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";

type Item = { domain: string; params: Record<string, string>; updatedAt: number };
type OwnerProfile = {
  ownerName: string;
  ownerEmail: string;
  paypalEmail: string;
  venmoHandle: string;
  stripeEmail: string;
  defaultReferralCode: string;
  notes: Record<string, string>;
};
type Overview = {
  publicReferrals: number;
  activePremium: number;
  emailCaptures: number;
  activeFeaturedSlots: number;
  ingestedOffers: number;
  completedRevenueCents: number;
  lastIngestedAt: number;
  stripeConfigured: boolean;
  adsTxtUrl: string;
  ownerRewardProfileReady: boolean;
  hqGateway: { webhookUrl: string; sharedSecretConfigured: boolean; updatedAt: number };
  automation: { autoFeatureAttributedFeed: boolean; autoFeatureLimit: number };
  crawlSchedule: string;
};

type FinderItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  score: number;
  updatedAt: number;
  domain: string;
  configured: boolean;
};

type AdminTask = {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata_json: string;
  status: string;
  created_at: number;
};

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  subscriptionStatus: string;
  currentPeriodEnd: number;
};

type ClickTotals = {
  curatedClicks: number;
  ingestedClicks: number;
  affiliateClicks: number;
  attributionDomains: number;
};

type TopLink = {
  id: string;
  title: string;
  url: string;
  domain: string;
  clicks: number;
  lastClickAt: number;
  source: string;
  attributed: boolean;
};

type AffiliateClick = {
  code: string;
  userId: string | null;
  userAgent: string;
  createdAt: number;
};

// Vendors where the referral code lives in the URL path, not a query param.
// `?ref=` on these does nothing — credit only flows when the user visits the
// personal /path/<code> link directly.
const PATH_BASED_DOMAINS = new Set([
  "dropbox.com",
  "uber.com",
  "wise.com",
  "robinhood.com",
  "chime.com",
  "sofi.com",
  "coinbase.com",
  "acorns.com",
  "notion.so",
]);

// Vendors that route attribution through Impact/CJ/LinkShare — the entire
// tracked URL is unique, so query params on the canonical domain do nothing.
const AFFILIATE_NETWORK_DOMAINS = new Set([
  "shopify.com",
  "fiverr.com",
  "rakuten.com",
  "surfshark.com",
]);

// Vendors that use a referral query param under a different key.
const WRONG_PARAM_DOMAINS: Record<string, string> = {
  "amazon.com": "tag",
  "hostinger.com": "REFERRALCODE",
  "freelancer.com": "aff",
  "swagbucks.com": "rb",
};

type DomainStatus =
  | { kind: "placeholder"; label: string; explain: string }
  | { kind: "wrong-mechanism"; label: string; explain: string }
  | { kind: "wrong-param"; label: string; explain: string; correctKey: string }
  | { kind: "working"; label: string; explain: string };

function classifyDomain(item: Item): DomainStatus {
  const values = Object.values(item.params ?? {});
  const hasPlaceholder = values.some((v) => /YOUR_CODE_HERE/i.test(String(v)));
  if (hasPlaceholder) {
    return {
      kind: "placeholder",
      label: "Placeholder",
      explain: "The params still say YOUR_CODE_HERE. This earns nothing — replace with a real value or delete it.",
    };
  }
  if (PATH_BASED_DOMAINS.has(item.domain)) {
    return {
      kind: "wrong-mechanism",
      label: "Won't credit (path-based)",
      explain: `${item.domain} uses path-based referrals (e.g. /invite/<code>). Adding ?ref= does nothing. Update the referral card's URL to your personal share link instead, then delete this entry.`,
    };
  }
  if (AFFILIATE_NETWORK_DOMAINS.has(item.domain)) {
    return {
      kind: "wrong-mechanism",
      label: "Won't credit (affiliate network)",
      explain: `${item.domain} attributes via Impact/CJ/LinkShare — the whole tracked URL is unique. Paste your full affiliate URL as the referral card URL; delete this entry.`,
    };
  }
  const expectedKey = WRONG_PARAM_DOMAINS[item.domain];
  if (expectedKey) {
    const keys = Object.keys(item.params ?? {});
    const hasCorrectKey = keys.some((k) => k.toLowerCase() === expectedKey.toLowerCase());
    if (!hasCorrectKey) {
      return {
        kind: "wrong-param",
        label: `Wrong param key (needs ${expectedKey})`,
        explain: `${item.domain} uses ?${expectedKey}= for attribution. Update the key in this row's JSON.`,
        correctKey: expectedKey,
      };
    }
  }
  return {
    kind: "working",
    label: "Earning",
    explain: "Configured. Clicks to this domain will carry your params.",
  };
}

function statusBadgeClass(kind: DomainStatus["kind"]) {
  switch (kind) {
    case "working":
      return "rounded-full bg-neon/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neon";
    case "wrong-param":
      return "rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300";
    case "wrong-mechanism":
      return "rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300";
    case "placeholder":
      return "rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70";
  }
}

function ExplainerBlock({ what, todo, how }: { what: string; todo?: string; how?: string }) {
  return (
    <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
      <div>
        <span className="font-semibold text-white">What this is:</span> {what}
      </div>
      {todo ? (
        <div className="mt-2">
          <span className="font-semibold text-electric">What to do:</span> {todo}
        </div>
      ) : null}
      {how ? (
        <div className="mt-2 text-muted">
          <span className="font-semibold text-white/70">How:</span> {how}
        </div>
      ) : null}
    </div>
  );
}

function SectionHeading({ step, title, subtitle, status }: { step?: number; title: string; subtitle?: string; status?: { label: string; tone: "ok" | "warn" | "info" } }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-3">
          {typeof step === "number" ? (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold text-neon">
              {step}
            </span>
          ) : null}
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        </div>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {status ? (
        <span
          className={
            status.tone === "ok"
              ? "rounded-full bg-neon/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neon"
              : status.tone === "warn"
              ? "rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300"
              : "rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70"
          }
        >
          {status.label}
        </span>
      ) : null}
    </div>
  );
}

function safeParseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function normDomain(host: string) {
  return host.replace(/^www\./i, "").toLowerCase();
}

export function Admin() {
  const user = useAppStore((s) => s.user);
  const isAdmin = Boolean(user?.isAdmin);
  const [items, setItems] = useState<Item[]>([]);
  const [domain, setDomain] = useState("dropbox.com");
  const [paramsJson, setParamsJson] = useState('{\n  "ref": "YOUR_CODE_HERE"\n}');
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>({
    ownerName: "",
    ownerEmail: "",
    paypalEmail: "",
    venmoHandle: "",
    stripeEmail: "",
    defaultReferralCode: "",
    notes: {
      niche: "",
      preferredPrograms: "",
      payoutDestination: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [hqWebhookUrl, setHqWebhookUrl] = useState("");
  const [hqSharedSecret, setHqSharedSecret] = useState("");
  const [autoFeatureAttributedFeed, setAutoFeatureAttributedFeed] = useState(true);
  const [autoFeatureLimit, setAutoFeatureLimit] = useState(4);
  const [finder, setFinder] = useState<FinderItem[]>([]);
  const [finderQuery, setFinderQuery] = useState("");
  const [refLink, setRefLink] = useState("");
  const [refDomain, setRefDomain] = useState("");
  const [refParamsJson, setRefParamsJson] = useState('{\n  "ref": "YOUR_CODE_HERE"\n}');
  const [refParseNote, setRefParseNote] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [clickTotals, setClickTotals] = useState<ClickTotals | null>(null);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [affiliateClicks, setAffiliateClicks] = useState<AffiliateClick[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const load = async () => {
    const r = await fetch("/api/owner-attribution", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load");
    setItems(data.items ?? []);
  };

  const loadOwnerProfile = async () => {
    const r = await fetch("/api/owner-profile", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load owner profile");
    setOwnerProfile({
      ownerName: data.profile?.ownerName ?? "",
      ownerEmail: data.profile?.ownerEmail ?? "",
      paypalEmail: data.profile?.paypalEmail ?? "",
      venmoHandle: data.profile?.venmoHandle ?? "",
      stripeEmail: data.profile?.stripeEmail ?? "",
      defaultReferralCode: data.profile?.defaultReferralCode ?? "",
      notes: {
        niche: data.profile?.notes?.niche ?? "",
        preferredPrograms: data.profile?.notes?.preferredPrograms ?? "",
        payoutDestination: data.profile?.notes?.payoutDestination ?? "",
      },
    });
  };

  const loadOverview = async () => {
    const r = await fetch("/api/admin/overview", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load overview");
    setOverview(data.overview ?? null);
    setHqWebhookUrl(data.overview?.hqGateway?.webhookUrl ?? "");
    setHqSharedSecret("");
    setAutoFeatureAttributedFeed(data.overview?.automation?.autoFeatureAttributedFeed !== false);
    setAutoFeatureLimit(Number(data.overview?.automation?.autoFeatureLimit ?? 4));
  };

  const loadFinder = async () => {
    const r = await fetch("/api/admin/referral-finder", { credentials: "include" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? "Failed to load referral finder");
    setFinder(data.items ?? []);
  };

  const loadTasks = async () => {
    const r = await fetch("/api/admin/tasks", { credentials: "include" });
    const data = await r.json();
    if (r.ok) setTasks(data.tasks ?? []);
  };

  const loadUsers = async () => {
    const r = await fetch("/api/admin/users", { credentials: "include" });
    const data = await r.json();
    if (r.ok) setUsers(data.users ?? []);
  };

  const loadClicks = async () => {
    const r = await fetch("/api/admin/clicks", { credentials: "include" });
    const data = await r.json();
    if (r.ok) {
      setClickTotals(data.totals ?? null);
      setTopLinks(data.topLinks ?? []);
      setAffiliateClicks(data.recentAffiliateClicks ?? []);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await fetch("/api/admin/tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadTasks();
  };

  const deleteDomain = async (domainToDelete: string) => {
    if (!window.confirm(`Delete the attribution row for ${domainToDelete}?\n\nClicks to this domain will go through with no extra params after this.`)) return;
    const r = await fetch(`/api/owner-attribution?domain=${encodeURIComponent(domainToDelete)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) load();
    else setError("Failed to delete entry.");
  };

  useEffect(() => {
    load().catch(() => null);
    loadOwnerProfile().catch(() => null);
    loadOverview().catch(() => null);
    loadFinder().catch(() => null);
    loadTasks().catch(() => null);
    loadUsers().catch(() => null);
    loadClicks().catch(() => null);
  }, []);

  const filteredFinder = useMemo(() => {
    const q = finderQuery.trim().toLowerCase();
    if (!q) return finder;
    return finder.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.domain.toLowerCase().includes(q),
    );
  }, [finder, finderQuery]);

  const itemsClassified = useMemo(() => items.map((item) => ({ item, status: classifyDomain(item) })), [items]);
  const earningCount = itemsClassified.filter((x) => x.status.kind === "working").length;
  const brokenCount = itemsClassified.length - earningCount;

  const profileFilled = Boolean(ownerProfile.ownerName && ownerProfile.defaultReferralCode);
  const profileNameLooksLikeEmail = /@/.test(ownerProfile.ownerName);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Seo title="Admin — referrals.live" description="Admin dashboard." path="/admin" />
        <h1 className="font-display text-3xl font-bold text-white">Admin only</h1>
        <p className="mt-3 text-sm text-muted">Login as the owner admin account to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Seo title="Admin — referrals.live" description="Configure owner attribution and ingestion." path="/admin" />

      <header>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Owner controls</div>
        <h1 className="mt-1 font-display text-4xl font-extrabold text-white">Admin dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          This is your control room. Work top to bottom — the steps below take you from {`"site is running"`} to {`"my links are earning."`}
        </p>
      </header>

      {/* HOW THIS DASHBOARD WORKS */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading title="How this dashboard works" subtitle="A quick map so you know what each section does." />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { n: 1, label: "Reward profile", explain: "Your name, payout details, and default code. Used to fill in every tracked link." },
            { n: 2, label: "Programs to join", explain: "Each hour the bot finds new programs. Sign up and paste your link." },
            { n: 3, label: "Earnings", explain: "See which links are getting clicks and whether they're carrying your code." },
            { n: 4, label: "Configured domains", explain: "Domains that auto-append your params on outbound clicks." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-neon">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold">{s.n}</span>
                <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">{s.explain}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SITE STATS */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading title="Site at a glance" subtitle="Live counts pulled from production. Nothing to do here — just situational awareness." />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Public referrals", overview?.publicReferrals ?? 0],
            ["Active premium", overview?.activePremium ?? 0],
            ["Email captures", overview?.emailCaptures ?? 0],
            ["Signed-up users", users.length],
            ["Featured live", overview?.activeFeaturedSlots ?? 0],
            ["Revenue (Stripe)", `$${((overview?.completedRevenueCents ?? 0) / 100).toFixed(2)}`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</div>
              <div className="mt-2 font-display text-3xl font-bold text-white">{String(value)}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Stripe</div>
            <div className="mt-1 font-semibold text-white">{overview?.stripeConfigured ? "Connected" : "Needs attention"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Crawler</div>
            <div className="mt-1 font-semibold text-white">{overview?.crawlSchedule ?? "Every hour"}</div>
            <div className="text-xs text-muted">
              Last: {overview?.lastIngestedAt ? new Date(overview.lastIngestedAt).toLocaleString() : "waiting"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Reward profile</div>
            <div className="mt-1 font-semibold text-white">{overview?.ownerRewardProfileReady ? "Filled" : "Empty"}</div>
          </div>
        </div>
      </div>

      {/* STEP 1: REWARD PROFILE */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading
          step={1}
          title="Your reward profile"
          subtitle="The single source of truth for your name + codes. These values get plugged into every outbound link."
          status={profileFilled ? (profileNameLooksLikeEmail ? { label: "Name looks like an email", tone: "warn" } : { label: "Filled", tone: "ok" }) : { label: "Empty", tone: "warn" }}
        />
        <ExplainerBlock
          what={"A profile that holds your real name, payout emails, and default referral code. The /go/:id redirector reads from here whenever a link template uses tokens like {{OWNER_NAME}} or {{DEFAULT_REFERRAL_CODE}}."}
          todo="Put a real name in 'Owner name' — not your email. Set Default Referral Code to the code you use at the most programs (you can override per-domain below)."
          how="Fill the fields, click Save. Changes take effect on the next outbound click."
        />

        {profileNameLooksLikeEmail ? (
          <div className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            ⚠ Your <strong>Owner name</strong> looks like an email address. Vendors that take a name parameter will receive your email as your "name." Replace it with a real name (e.g. {`"`}J Swain{`"`}, {`"`}3000Studios{`"`}).
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["Owner name (your real name, not email)", "ownerName", "J Swain"],
            ["Owner email", "ownerEmail", "you@example.com"],
            ["PayPal email", "paypalEmail", "name@example.com"],
            ["Venmo handle", "venmoHandle", "@yourhandle"],
            ["Stripe email", "stripeEmail", "billing@example.com"],
            ["Default referral code", "defaultReferralCode", "YOURCODE123"],
          ].map(([label, key, placeholder]) => (
            <label key={String(key)} className="block text-xs uppercase tracking-wide text-muted">
              {label}
              <input
                value={(ownerProfile as any)[key]}
                onChange={(e) => setOwnerProfile((current) => ({ ...current, [key]: e.target.value }))}
                placeholder={String(placeholder)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["Primary niche", "niche", "fintech, travel, SaaS"],
            ["Preferred programs", "preferredPrograms", "cards, hosting, AI tools"],
            ["Payout destination (note only)", "payoutDestination", "PayPal / Venmo / Stripe"],
          ].map(([label, key, placeholder]) => (
            <label key={String(key)} className="block text-xs uppercase tracking-wide text-muted">
              {label}
              <input
                value={ownerProfile.notes[key] ?? ""}
                onChange={(e) =>
                  setOwnerProfile((current) => ({
                    ...current,
                    notes: { ...current.notes, [key]: e.target.value },
                  }))
                }
                placeholder={String(placeholder)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted">
          Payout destination is just a note for yourself — actual money is routed by each vendor's own dashboard (Stripe Dashboard for subscription revenue, the affiliate portal of each program for referral payouts).
        </div>

        <button
          type="button"
          onClick={async () => {
            setError(null);
            setSaved(false);
            try {
              const r = await fetch("/api/owner-profile", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ownerProfile),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data?.error ?? "Failed to save owner profile");
              setSaved(true);
              setTimeout(() => setSaved(false), 1200);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to save owner profile");
            }
          }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-gold to-yellow-300 px-6 py-4 text-sm font-semibold text-black"
        >
          Save reward profile
        </button>
      </div>

      {/* STEP 2: PROGRAMS TO JOIN */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading
          step={2}
          title="Programs the bot wants you to join"
          subtitle="The hourly crawler discovers new referral programs. Each one becomes a task here — sign up, then come back and paste your link below."
          status={tasks.length ? { label: `${tasks.length} waiting`, tone: "warn" } : { label: "Caught up", tone: "ok" }}
        />
        <ExplainerBlock
          what="A task list of referral programs auto-discovered for you. Each card has a link to the official signup page."
          todo="Click 'Open site' on a card → sign up → grab your personal referral link from their dashboard → paste it in Step 3 below → click 'Mark Joined' here."
          how="Some signups need email verification. The personal link from each vendor is what carries your credit, not anything on this site."
        />
        <div className="mt-2 flex justify-end">
          <button onClick={loadTasks} className="text-xs font-semibold text-muted hover:text-white">Refresh tasks</button>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.length ? tasks.map((task) => {
            const meta = JSON.parse(task.metadata_json || "{}");
            return (
              <div key={task.id} className="relative rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-gold">{task.type}</div>
                <h4 className="mt-2 font-display text-lg font-bold text-white">{task.title}</h4>
                <p className="mt-2 text-sm text-muted leading-relaxed">{task.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={meta.url} target="_blank" rel="noreferrer" className="rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white hover:brightness-110">Open site</a>
                  <button onClick={() => updateTaskStatus(task.id, "dismissed")} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-muted hover:text-white">Dismiss</button>
                  <button onClick={() => updateTaskStatus(task.id, "completed")} className="rounded-xl bg-neon px-4 py-2 text-xs font-bold text-black">Mark Joined</button>
                </div>
              </div>
            );
          }) : (
            <div className="py-12 text-center text-sm text-muted col-span-full border border-dashed border-white/5 rounded-3xl">
              No pending tasks. The bot finds new programs every hour — check back later.
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: PASTE REFERRAL LINK */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading
          step={3}
          title="Paste your referral link"
          subtitle="The bridge between Step 2 (you signed up) and Step 4 (clicks earn you credit)."
        />
        <ExplainerBlock
          what="A tool that takes your personal referral URL from a vendor and turns it into a 'configured domain' below — so every outbound click on that domain carries your code."
          todo="After joining a program, paste the personal link the vendor gave you. The tool extracts the domain + query params automatically."
          how="Hit 'Auto-detect params,' verify, optionally replace specific values with tokens like {{DEFAULT_REFERRAL_CODE}}, then click 'Save cash-link config'."
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* PROGRAM FINDER */}
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-electric">Find a program</div>
                <p className="mt-1 text-xs text-muted">Search the discovered list. Click "Open signup" to join.</p>
              </div>
              <button
                type="button"
                onClick={() => loadFinder().catch(() => null)}
                className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-neon/40"
              >
                Refresh
              </button>
            </div>
            <input
              value={finderQuery}
              onChange={(e) => setFinderQuery(e.target.value)}
              placeholder="Search wise, shopify, hosting, crypto…"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
            />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {filteredFinder.slice(0, 12).map((it) => (
                <div key={it.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">{it.title}</div>
                      <div className="mt-1 text-xs text-muted">{it.domain} · {it.category} · score {it.score}</div>
                    </div>
                    <span
                      className={
                        it.configured
                          ? "shrink-0 rounded-full bg-neon/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neon"
                          : "shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60"
                      }
                    >
                      {it.configured ? "configured" : "not set"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted">{it.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={it.url} target="_blank" rel="noreferrer" className="rounded-2xl bg-gradient-to-r from-electric to-neon px-4 py-2 text-xs font-semibold text-black">
                      Open signup
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setRefDomain(it.domain);
                        setRefParamsJson('{\n  "ref": "YOUR_CODE_HERE"\n}');
                        setRefParseNote("Tip: After you join, paste your actual referral link to auto-detect the real params.");
                      }}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:border-neon/40"
                    >
                      Use this domain →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PASTE FORM */}
          <div className="rounded-3xl border border-neon/20 bg-neon/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Your personal referral link</div>
            <p className="mt-1 text-xs text-muted">Paste it once, save it. Future clicks to this domain carry your code automatically.</p>

            <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
              Step A — paste link
              <input
                value={refLink}
                onChange={(e) => setRefLink(e.target.value)}
                placeholder="https://partner.com/?ref=YOURCODE"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setRefParseNote(null);
                const u = safeParseUrl(refLink.trim());
                if (!u) {
                  setRefParseNote("Invalid URL. Paste the full https://… link.");
                  return;
                }
                const d = normDomain(u.hostname);
                setRefDomain(d);
                const params: Record<string, string> = {};
                u.searchParams.forEach((v, k) => {
                  const key = String(k).trim();
                  const val = String(v).trim();
                  if (!key || !val) return;
                  params[key] = val;
                });
                if (!Object.keys(params).length) {
                  setRefParseNote("No query params detected. If your code is in the URL path (Dropbox, Wise, etc.), this domain doesn't need a 'Configured domain' entry — instead update the referral card's URL directly.");
                  setRefParamsJson('{\n  "ref": "YOUR_CODE_HERE"\n}');
                  return;
                }
                setRefParamsJson(JSON.stringify(params, null, 2));
                setRefParseNote("Detected params. You can replace specific values with tokens like {{DEFAULT_REFERRAL_CODE}} so this row stays in sync if your code changes.");
              }}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-gold to-yellow-300 px-4 py-3 text-sm font-semibold text-black"
            >
              Step B — Auto-detect params
            </button>

            <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
              Step C — domain (auto-filled)
              <input
                value={refDomain}
                onChange={(e) => setRefDomain(e.target.value)}
                placeholder="e.g. wise.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
              Step D — params (review before saving)
              <textarea
                value={refParamsJson}
                onChange={(e) => setRefParamsJson(e.target.value)}
                rows={6}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 outline-none ring-neon/30 focus:ring"
              />
            </label>

            {refParseNote ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-muted">{refParseNote}</div>
            ) : null}

            <button
              type="button"
              onClick={async () => {
                setError(null);
                setSaved(false);
                try {
                  const parsed = JSON.parse(refParamsJson);
                  const r = await fetch("/api/owner-attribution", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ domain: refDomain.trim(), params: parsed }),
                  });
                  const data = await r.json();
                  if (!r.ok) throw new Error(data?.error ?? "Failed to save domain params");
                  await load();
                  await loadFinder();
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1200);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to save domain params");
                }
              }}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-3 text-sm font-semibold text-black shadow-neon"
            >
              Step E — Save cash-link config
            </button>
          </div>
        </div>
      </div>

      {/* STEP 4: EARNINGS / CLICK TRACKING */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading
          step={4}
          title="Click tracking & owner attribution"
          subtitle="Where you confirm clicks are flowing through your codes."
        />
        <ExplainerBlock
          what="Every outbound click goes through /go/:id, which looks up the domain in your 'Configured domains' list and appends your params. This table shows what's actually getting clicks."
          todo="Scan for any row marked 'No params' — those are getting clicks but not earning. Configure them in Step 3."
          how="Click 'Refresh clicks' to pull the latest from production D1."
        />
        <div className="mt-3 flex justify-end">
          <button onClick={loadClicks} className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:border-neon/40">
            Refresh clicks
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Curated clicks", clickTotals?.curatedClicks ?? 0],
            ["Auto-discovered clicks", clickTotals?.ingestedClicks ?? 0],
            ["Affiliate code clicks", clickTotals?.affiliateClicks ?? 0],
            ["Domains attributed", clickTotals?.attributionDomains ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</div>
              <div className="mt-2 font-display text-3xl font-bold text-white">{String(value)}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Top earning links</div>
            {topLinks.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.18em] text-muted">
                    <tr>
                      <th className="border-b border-white/10 py-2 pr-3">Program</th>
                      <th className="border-b border-white/10 py-2 pr-3">Domain</th>
                      <th className="border-b border-white/10 py-2 pr-3 text-right">Clicks</th>
                      <th className="border-b border-white/10 py-2 pr-3">Attribution</th>
                      <th className="border-b border-white/10 py-2 pr-3">Last click</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLinks.map((link) => (
                      <tr key={`${link.source}-${link.id}`} className="text-white/85">
                        <td className="border-b border-white/5 py-2 pr-3 align-top">
                          <div className="font-semibold text-white">{link.title || link.id}</div>
                          <div className="text-[11px] uppercase tracking-wide text-muted">{link.source}</div>
                        </td>
                        <td className="border-b border-white/5 py-2 pr-3 align-top text-muted">{link.domain || "—"}</td>
                        <td className="border-b border-white/5 py-2 pr-3 align-top text-right font-semibold text-white">{link.clicks.toLocaleString()}</td>
                        <td className="border-b border-white/5 py-2 pr-3 align-top">
                          <span
                            className={
                              link.attributed
                                ? "rounded-full bg-neon/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neon"
                                : "rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300"
                            }
                          >
                            {link.attributed ? "Earning" : "No params"}
                          </span>
                        </td>
                        <td className="border-b border-white/5 py-2 pr-3 align-top text-muted">
                          {link.lastClickAt ? new Date(link.lastClickAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
                No outbound clicks yet. Visit a card from the homepage to start populating this.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Recent referral-code clicks</div>
            <p className="mt-1 text-xs text-muted">When subscribers share their codes, hits land here.</p>
            <div className="mt-4 space-y-2">
              {affiliateClicks.length ? (
                affiliateClicks.slice(0, 10).map((click, idx) => (
                  <div key={`${click.code}-${click.createdAt}-${idx}`} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-neon">{click.code}</span>
                      <span className="text-muted">{click.createdAt ? new Date(click.createdAt).toLocaleString() : "—"}</span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted">{click.userAgent || "unknown UA"}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-muted">
                  No affiliate code clicks yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 5: CONFIGURED DOMAINS — WITH STATUS BADGES + DELETE */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading
          step={5}
          title="Configured domains"
          subtitle="Every domain that auto-appends your params on outbound clicks."
          status={
            brokenCount > 0
              ? { label: `${brokenCount} need attention`, tone: "warn" }
              : { label: `${earningCount} earning`, tone: "ok" }
          }
        />
        <ExplainerBlock
          what="The list of domains where /go/:id will inject your params (?ref=, ?tag=, etc.) on every outbound click."
          todo="Look for rows tagged in red or amber — those don't actually credit you. Delete them, or fix them in Step 3."
          how="Color guide: green = earning · amber = wrong param key (fixable) · red = wrong attribution model (delete and use the personal link directly as the referral card URL) · grey = placeholder (delete)."
        />

        <div className="mt-5 space-y-3">
          {itemsClassified.length ? (
            itemsClassified.map(({ item, status }) => (
              <div key={item.domain} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-white">{item.domain}</div>
                    <span className={statusBadgeClass(status.kind)}>{status.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted">{new Date(item.updatedAt).toLocaleString()}</div>
                    <button
                      type="button"
                      onClick={() => deleteDomain(item.domain)}
                      className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">{status.explain}</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 text-xs text-white/80">
                  {JSON.stringify(item.params, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
              No domains configured yet. Use Step 3 above to add your first one.
            </div>
          )}
        </div>
      </div>

      {/* REAL USERS */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <SectionHeading
          title="Members"
          subtitle="Every account on production D1."
        />
        <div className="mt-3 flex justify-end">
          <button onClick={loadUsers} className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:border-neon/40">
            Refresh
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="border-b border-white/10 py-3 pr-4">Email</th>
                <th className="border-b border-white/10 py-3 pr-4">Display name</th>
                <th className="border-b border-white/10 py-3 pr-4">Plan</th>
                <th className="border-b border-white/10 py-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="text-white/85">
                  <td className="border-b border-white/5 py-3 pr-4">{item.email}</td>
                  <td className="border-b border-white/5 py-3 pr-4">{item.displayName || "Creator"}</td>
                  <td className="border-b border-white/5 py-3 pr-4">{item.subscriptionStatus}</td>
                  <td className="border-b border-white/5 py-3 pr-4">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length ? <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted">No user accounts yet.</div> : null}
        </div>
      </div>

      {/* ADVANCED — COLLAPSIBLE */}
      <div className="glass rounded-3xl border border-white/10 p-6">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3"
        >
          <SectionHeading title="Advanced settings" subtitle="HQ gateway, auto-feature behavior, raw domain editor. Most owners never touch these." />
          <span className="text-xs font-semibold text-neon">{advancedOpen ? "Hide" : "Show"}</span>
        </button>

        {advancedOpen ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* HQ Gateway */}
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">3000Studios.vip gateway</div>
              <p className="mt-2 text-sm text-muted">
                Optional — push crawl summaries into 3000studios.vip via webhook. Skip if you don't have an HQ to wire up.
              </p>
              <label className="mt-3 block text-xs uppercase tracking-wide text-muted">
                HQ webhook URL
                <input
                  value={hqWebhookUrl}
                  onChange={(e) => setHqWebhookUrl(e.target.value)}
                  placeholder="https://3000studios.vip/api/hq/intake"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
                />
              </label>
              <label className="mt-3 block text-xs uppercase tracking-wide text-muted">
                Shared secret (optional)
                <input
                  value={hqSharedSecret}
                  onChange={(e) => setHqSharedSecret(e.target.value)}
                  placeholder="optional secret for secure posts"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
                />
              </label>
              <div className="mt-2 text-xs text-muted">
                Status: <span className="text-white">{overview?.hqGateway?.webhookUrl ? "Connected" : "Not connected"}</span>
              </div>

              <label className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
                <span>Auto-feature attributable offers on homepage</span>
                <input
                  type="checkbox"
                  checked={autoFeatureAttributedFeed}
                  onChange={(e) => setAutoFeatureAttributedFeed(e.target.checked)}
                  className="h-4 w-4 accent-lime-400"
                />
              </label>
              <label className="mt-3 block text-xs uppercase tracking-wide text-muted">
                Auto-feature limit
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={autoFeatureLimit}
                  onChange={(e) => setAutoFeatureLimit(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setSaved(false);
                  try {
                    const r = await fetch("/api/admin/overview", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        webhookUrl: hqWebhookUrl.trim(),
                        sharedSecret: hqSharedSecret.trim(),
                        autoFeatureAttributedFeed,
                        autoFeatureLimit,
                      }),
                    });
                    const data = await r.json();
                    if (!r.ok) throw new Error(data?.error ?? "Failed to save HQ gateway");
                    await loadOverview();
                    setSaved(true);
                    setTimeout(() => setSaved(false), 1200);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to save HQ gateway");
                  }
                }}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-electric to-neon px-6 py-3 text-sm font-semibold text-black"
              >
                Save advanced settings
              </button>
            </div>

            {/* Raw domain editor */}
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Raw domain editor</div>
              <p className="mt-2 text-sm text-muted">
                Manual entry — use this only when Step 3's auto-detect doesn't work. Available tokens: {`{{OWNER_NAME}}, {{OWNER_EMAIL}}, {{PAYPAL_EMAIL}}, {{VENMO_HANDLE}}, {{STRIPE_EMAIL}}, {{DEFAULT_REFERRAL_CODE}}.`}
              </p>
              <label className="mt-3 block text-xs uppercase tracking-wide text-muted">
                Domain (no scheme)
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. wise.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
                />
              </label>
              <label className="mt-3 block text-xs uppercase tracking-wide text-muted">
                Params JSON
                <textarea
                  value={paramsJson}
                  onChange={(e) => setParamsJson(e.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 outline-none ring-neon/30 focus:ring"
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setSaved(false);
                  try {
                    const parsed = JSON.parse(paramsJson);
                    const r = await fetch("/api/owner-attribution", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ domain: domain.trim(), params: parsed }),
                    });
                    const data = await r.json();
                    if (!r.ok) throw new Error(data?.error ?? "Failed to save");
                    await load();
                    setSaved(true);
                    setTimeout(() => setSaved(false), 1200);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Invalid JSON");
                  }
                }}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-3 text-sm font-semibold text-black shadow-neon"
              >
                Save raw entry
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Toast row */}
      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {saved ? (
        <div className="rounded-2xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm text-white">Saved.</div>
      ) : null}
    </div>
  );
}
