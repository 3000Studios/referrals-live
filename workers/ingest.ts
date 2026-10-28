export type Env = {
  DB: D1Database;
  CHAT: DurableObjectNamespace;
  GEMINI_API_KEY?: string;
};

type ChatStoredMessage = {
  id: string;
  ts: number;
  user: string;
  role: string;
  text: string;
  avatar?: string;
  color?: string;
  reactions?: Record<string, string[]>;
};

const ALLOWED_REACTIONS = ["👍", "❤️", "🔥", "🎉", "💸", "👀", "🙌", "🚀"];

type Curated = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  imageUrl: string;
  score: number;
};

const curated: Curated[] = [
  {
    id: "ref-dropbox",
    title: "Dropbox — Referral Program",
    description: "Invite friends to Dropbox and earn extra space. Official referral program page.",
    url: "https://www.dropbox.com/referrals",
    category: "saas",
    tags: ["storage", "referrals", "productivity"],
    imageUrl: "https://cdn.simpleicons.org/dropbox/0061FF",
    score: 90,
  },
  {
    id: "ref-wise",
    title: "Wise — Invite Friends",
    description: "Invite friends to Wise and earn rewards (official invite page).",
    url: "https://wise.com/invite",
    category: "fintech",
    tags: ["money", "international", "invite"],
    imageUrl: "https://cdn.simpleicons.org/wise/9FE870",
    score: 86,
  },
  {
    id: "ref-shopify",
    title: "Shopify — Affiliate Program",
    description: "Promote Shopify and earn commissions (official affiliate program page).",
    url: "https://www.shopify.com/affiliates",
    category: "ecommerce",
    tags: ["ecommerce", "affiliate", "saas"],
    imageUrl: "https://cdn.simpleicons.org/shopify/7AB55C",
    score: 92,
  },
  // Added 2026-10-11 (owner order: add 20+ new best links). Every URL below
  // was fetched and verified live before inclusion — real program pages only,
  // no personal codes, no 404/parked destinations. Mirrors migration 0019.
  // ref-sofi was removed 2026-10-28 by owner decision (SoFi is PRIVATE per
  // standing ruling M49; see migration 0025). Do not re-add it here.
  {
    id: "ref-acorns",
    title: "Acorns — Invite Friends",
    description: "Acorns official invite page: invite friends to start investing spare change.",
    url: "https://www.acorns.com/invite",
    category: "fintech",
    tags: ["fintech", "investing", "invite"],
    imageUrl: "https://www.google.com/s2/favicons?domain=acorns.com&sz=256",
    score: 84,
  },
  {
    id: "ref-betterment",
    title: "Betterment — Friend Referral",
    description: "Betterment official friend-referral offer page for automated investing.",
    url: "https://www.betterment.com/friend-referral-offer",
    category: "fintech",
    tags: ["fintech", "investing", "referrals"],
    imageUrl: "https://www.google.com/s2/favicons?domain=betterment.com&sz=256",
    score: 82,
  },
  {
    id: "ref-schwab",
    title: "Charles Schwab — Referral Program",
    description: "Charles Schwab official referral page: how the referral bonus program works.",
    url: "https://www.schwab.com/referral",
    category: "fintech",
    tags: ["fintech", "brokerage", "referrals"],
    imageUrl: "https://www.google.com/s2/favicons?domain=schwab.com&sz=256",
    score: 83,
  },
  {
    id: "ref-gemini",
    title: "Gemini — Referral Program",
    description: "Gemini official referral program page: refer friends and earn crypto rewards.",
    url: "https://www.gemini.com/referrals",
    category: "crypto",
    tags: ["crypto", "exchange", "referrals"],
    imageUrl: "https://www.google.com/s2/favicons?domain=gemini.com&sz=256",
    score: 85,
  },
  {
    id: "ref-kraken",
    title: "Kraken — Referrals",
    description: "Kraken official referrals page: invite friends and get rewards.",
    url: "https://www.kraken.com/referrals",
    category: "crypto",
    tags: ["crypto", "exchange", "invite"],
    imageUrl: "https://www.google.com/s2/favicons?domain=kraken.com&sz=256",
    score: 85,
  },
  {
    id: "ref-binanceus",
    title: "Binance.US — Referral Program",
    description: "Binance.US official referral page: refer friends and earn crypto.",
    url: "https://www.binance.us/referral",
    category: "crypto",
    tags: ["crypto", "exchange", "referrals"],
    imageUrl: "https://cdn.simpleicons.org/binance/F0B90B",
    score: 84,
  },
  {
    id: "ref-notion",
    title: "Notion — Affiliate Program",
    description: "Notion official affiliate program page: promote Notion and earn commissions.",
    url: "https://www.notion.com/affiliates",
    category: "saas",
    tags: ["saas", "productivity", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/notion/FFFFFF",
    score: 89,
  },
  {
    id: "ref-canva",
    title: "Canva — Affiliate Program",
    description: "Canva official affiliate program page (Canvassador Program).",
    url: "https://www.canva.com/affiliates/",
    category: "saas",
    tags: ["saas", "design", "affiliate"],
    imageUrl: "https://www.google.com/s2/favicons?domain=canva.com&sz=256",
    score: 88,
  },
  {
    id: "ref-hostinger",
    title: "Hostinger — Affiliate Program",
    description: "Hostinger official affiliate program page: earn promoting web hosting.",
    url: "https://www.hostinger.com/affiliates",
    category: "saas",
    tags: ["saas", "hosting", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/hostinger/673DE6",
    score: 87,
  },
  {
    id: "ref-namecheap",
    title: "Namecheap — Affiliate Program",
    description: "Namecheap official affiliate program page: earn promoting domains and hosting.",
    url: "https://www.namecheap.com/affiliates/",
    category: "saas",
    tags: ["saas", "domains", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/namecheap/DE3723",
    score: 86,
  },
  {
    id: "ref-digitalocean",
    title: "DigitalOcean — Referral Program",
    description: "DigitalOcean official referral program page for developers.",
    url: "https://www.digitalocean.com/referral-program",
    category: "saas",
    tags: ["saas", "cloud", "referrals"],
    imageUrl: "https://cdn.simpleicons.org/digitalocean/0080FF",
    score: 85,
  },
  {
    id: "ref-grammarly",
    title: "Grammarly — Affiliate Program",
    description: "Grammarly official affiliates page: earn promoting the writing assistant.",
    url: "https://www.grammarly.com/affiliates",
    category: "saas",
    tags: ["saas", "writing", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/grammarly/15C39A",
    score: 84,
  },
  {
    id: "ref-nordvpn",
    title: "NordVPN — Affiliate Program",
    description: "NordVPN official affiliate program page: earn commissions promoting the VPN.",
    url: "https://nordvpn.com/affiliate/",
    category: "saas",
    tags: ["saas", "vpn", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/nordvpn/4687FF",
    score: 86,
  },
  {
    id: "ref-bluehost",
    title: "Bluehost — Affiliate Program",
    description: "Bluehost official affiliate program page: earn on hosting referrals.",
    url: "https://www.bluehost.com/affiliates",
    category: "saas",
    tags: ["saas", "hosting", "affiliate"],
    imageUrl: "https://www.google.com/s2/favicons?domain=bluehost.com&sz=256",
    score: 85,
  },
  {
    id: "ref-siteground",
    title: "SiteGround — Affiliate Program",
    description: "SiteGround official affiliate hosting program page.",
    url: "https://www.siteground.com/affiliates",
    category: "saas",
    tags: ["saas", "hosting", "affiliate"],
    imageUrl: "https://www.google.com/s2/favicons?domain=siteground.com&sz=256",
    score: 84,
  },
  {
    id: "ref-hubspot",
    title: "HubSpot — Affiliate Program",
    description: "HubSpot official affiliate program page: earn promoting HubSpot CRM tools.",
    url: "https://www.hubspot.com/partners/affiliates",
    category: "saas",
    tags: ["saas", "crm", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/hubspot/FF7A59",
    score: 87,
  },
  {
    id: "ref-kit",
    title: "Kit — Affiliate Program",
    description: "Kit (ConvertKit) official affiliate program page: recurring commissions for creator email.",
    url: "https://kit.com/affiliate",
    category: "saas",
    tags: ["saas", "email", "affiliate"],
    imageUrl: "https://www.google.com/s2/favicons?domain=kit.com&sz=256",
    score: 85,
  },
  {
    id: "ref-surfshark",
    title: "Surfshark — Affiliate Program",
    description: "Surfshark official affiliate program page: earn promoting the VPN.",
    url: "https://surfshark.com/affiliate",
    category: "saas",
    tags: ["saas", "vpn", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/surfshark/1780A6",
    score: 83,
  },
  {
    id: "ref-expressvpn",
    title: "ExpressVPN — Affiliate Program",
    description: "ExpressVPN official affiliate program page: earn commissions promoting the VPN.",
    url: "https://www.expressvpn.com/affiliates",
    category: "saas",
    tags: ["saas", "vpn", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/expressvpn/DA3B2E",
    score: 83,
  },
  {
    id: "ref-udemy",
    title: "Udemy — Affiliate Program",
    description: "Udemy official affiliates program page: earn promoting online courses.",
    url: "https://www.udemy.com/affiliate/",
    category: "saas",
    tags: ["saas", "education", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/udemy/A435F0",
    score: 82,
  },
  {
    id: "ref-skillshare",
    title: "Skillshare — Affiliates",
    description: "Skillshare official affiliates page: earn commissions promoting online classes.",
    url: "https://www.skillshare.com/en/affiliates",
    category: "saas",
    tags: ["saas", "education", "affiliate"],
    imageUrl: "https://cdn.simpleicons.org/skillshare/00FF84",
    score: 81,
  },
  {
    id: "ref-airbnb",
    title: "Airbnb — Invite Friends",
    description: "Airbnb official invite page: invite friends to join Airbnb.",
    url: "https://www.airbnb.com/referrals",
    category: "travel",
    tags: ["travel", "referrals", "invite"],
    imageUrl: "https://cdn.simpleicons.org/airbnb/FF5A5F",
    score: 88,
  },
  {
    id: "ref-rakuten",
    title: "Rakuten — Refer a Friend",
    description: "Rakuten official referral page: refer friends to cash-back shopping and earn rewards.",
    url: "https://www.rakuten.com/referral",
    category: "ecommerce",
    tags: ["ecommerce", "cashback", "referrals"],
    imageUrl: "https://cdn.simpleicons.org/rakuten/BF0000",
    score: 89,
  },
  {
    id: "ref-walmart",
    title: "Walmart — Affiliate Program",
    description: "Walmart official affiliate program page: drive sales and earn commissions.",
    url: "https://affiliates.walmart.com/",
    category: "ecommerce",
    tags: ["ecommerce", "affiliate", "retail"],
    imageUrl: "https://www.google.com/s2/favicons?domain=walmart.com&sz=256",
    score: 84,
  },
  {
    id: "ref-etsy",
    title: "Etsy — Affiliates & Creators",
    description: "Etsy official affiliates page: earn commissions promoting one-of-a-kind products.",
    url: "https://www.etsy.com/affiliates",
    category: "ecommerce",
    tags: ["ecommerce", "affiliate", "marketplace"],
    imageUrl: "https://cdn.simpleicons.org/etsy/F1641E",
    score: 85,
  },
  {
    id: "ref-envato",
    title: "Envato — Affiliates",
    description: "Envato official affiliates page: earn promoting creative assets and templates.",
    url: "https://www.envato.com/affiliates/",
    category: "ecommerce",
    tags: ["ecommerce", "affiliate", "creative"],
    imageUrl: "https://cdn.simpleicons.org/envato/81B441",
    score: 82,
  },
  {
    id: "ref-fetch",
    title: "Fetch — Refer Friends",
    description: "Fetch official referral page: how to share your Fetch referral code and earn points.",
    url: "https://fetch.com/referral",
    category: "ecommerce",
    tags: ["ecommerce", "rewards", "referrals"],
    imageUrl: "https://www.google.com/s2/favicons?domain=fetch.com&sz=256",
    score: 83,
  },
];

function now() {
  return Date.now();
}

function nyDayKey(ts: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function upsert(env: Env) {
  const ts = now();
  const owner = await env.DB.prepare(
    "SELECT owner_name, owner_email, default_referral_code FROM owner_profile WHERE id='owner' LIMIT 1",
  ).first<any>();
  const stmts: D1PreparedStatement[] = [];
  for (const item of curated) {
    stmts.push(
      env.DB.prepare(
        `INSERT OR REPLACE INTO ingested_offers
         (id, source, source_url, canonical_key, title, description, url, category, tags_json, image_url, score, created_at, updated_at)
         VALUES (?, 'curated', ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM ingested_offers WHERE id=?), ?), ?)`,
      ).bind(
        item.id,
        item.url,
        `curated:${item.id}`,
        item.title,
        item.description,
        item.url,
        item.category,
        JSON.stringify(item.tags),
        item.imageUrl,
        item.score,
        item.id,
        ts,
        ts,
      ),
    );
  }
  await env.DB.batch(stmts);

  const gateway = await env.DB.prepare("SELECT value_json FROM site_settings WHERE key='hq_gateway' LIMIT 1").first<any>();
  if (gateway?.value_json) {
    const config = JSON.parse(gateway.value_json) as { webhookUrl?: string; sharedSecret?: string };
    if (config.webhookUrl) {
      const payload = {
        site: "referrals.live",
        generatedAt: ts,
        crawlSchedule: "*/30 * * * *",
        offers: curated.map((item) => ({ id: item.id, title: item.title, category: item.category, score: item.score })),
        owner: {
          ownerName: owner?.owner_name ?? "",
          ownerEmail: owner?.owner_email ?? "",
          defaultReferralCode: owner?.default_referral_code ?? "",
        },
      };
      const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8" };
      if (config.sharedSecret) headers["x-3000studios-secret"] = config.sharedSecret;
      await fetch(config.webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }).catch(() => null);
    }
  }
}

type BlogVideo = {
  src: string;
  label: string;
  attributionLabel: string;
  attributionHref: string;
};

const BLOG_VIDEOS: BlogVideo[] = [
  {
    src: "https://cdn.coverr.co/videos/coverr-a-woman-typing-on-a-laptop-3645/1080p.mp4",
    label: "Auto-play video: typing on a laptop",
    attributionLabel: "Video source: Coverr (free license)",
    attributionHref: "https://coverr.co/",
  },
  {
    src: "https://cdn.coverr.co/videos/coverr-a-girl-working-on-her-laptop-3714/1080p.mp4",
    label: "Auto-play video: working on a laptop",
    attributionLabel: "Video source: Coverr (free license)",
    attributionHref: "https://coverr.co/",
  },
  {
    src: "https://cdn.coverr.co/videos/coverr-close-up-of-a-young-man-using-his-smartphone-6745/1080p.mp4",
    label: "Auto-play video: using a smartphone",
    attributionLabel: "Video source: Coverr (free license)",
    attributionHref: "https://coverr.co/",
  },
];

async function ensureDailyBlogPost(env: Env) {
  const ts = now();
  const dayKey = nyDayKey(ts);
  const existing = await env.DB.prepare("SELECT id FROM blog_posts WHERE slug=? LIMIT 1").bind(`dri-${dayKey}`).first<any>();
  if (existing?.id) return;

  const offers = await env.DB.prepare(
    `SELECT id, title, description, url, category, tags_json, score
     FROM ingested_offers
     ORDER BY score DESC, updated_at DESC
     LIMIT 6`,
  ).all<any>();
  const top = (offers.results ?? []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title),
    description: String(r.description),
    url: String(r.url),
    category: String(r.category),
    tags: JSON.parse(r.tags_json ?? "[]") as string[],
    score: Number(r.score ?? 0),
  }));

  const primary = top[0]?.category ?? "referrals";
  const keywords = [
    "referral programs",
    "affiliate marketing",
    "passive income",
    "conversion optimization",
    "email list building",
    `${primary} referrals`,
    "best referral offers",
    "high converting landing pages",
  ].slice(0, 8);

  const titleSeed = [
    `Daily Referral Income (DRI): ${primary.toUpperCase()} Offers + A Conversion Playbook`,
    `DRI Daily: How to Turn Referral Traffic Into Subscribers (With ${primary} Picks)`,
    `DRI Daily Brief: ${primary} Referral Programs, CTAs, and SEO Moves That Compound`,
  ];
  const title = titleSeed[Math.floor((ts / 86_400_000) % titleSeed.length)];
  const slug = `dri-${dayKey}`;
  const excerpt =
    "A daily SEO-first brief that turns referral intent into compounding traffic and subscribers—plus today’s top attributed offers to link responsibly.";

  const video = BLOG_VIDEOS[Math.floor((ts / 86_400_000) % BLOG_VIDEOS.length)];

  const list = top.length
    ? top
        .map((o) => `- **${o.title}** (${o.category}) — ${o.description}  \n  Official page: ${o.url}  \n  Browse more: https://referrals.live/browse?cat=${encodeURIComponent(o.category)}`)
        .join("\n")
    : "- No offers are currently available. Check https://referrals.live/browse for the latest.";

  const body = [
    `# ${title}`,
    ``,
    `If you publish referral content, your best growth engine is a loop: **SEO intent → high-trust guide → clear CTA → subscriber capture → weekly digest → repeat clicks**.`,
    ``,
    `This is your DRI daily: a practical playbook + today’s top attributed offers to link responsibly.`,
    ``,
    `## Today’s best referral opportunities (link responsibly)`,
    ``,
    list,
    ``,
    `## The DRI content framework (what ranks and converts)`,
    ``,
    `1) **Pick a single intent cluster**: “best”, “review”, “bonus”, “how to”, “alternatives”, “fees”, “eligibility”.`,
    `2) **Answer in the first 120 seconds**: what the offer is, who it’s for, and the one step that causes drop-off.`,
    `3) **Add proof + clarity**: timelines, requirements, and disclosure. Trust is conversion.`,
    `4) **Internal-link aggressively (but honestly)**: point readers to https://referrals.live/browse, https://referrals.live/leaderboard, and your best “how it works” guide.`,
    `5) **Capture subscribers ethically**: the goal is a repeatable audience, not a one-off click.`,
    ``,
    `## 3 CTAs that increase subscribers without hurting UX`,
    ``,
    `- “Get the weekly top referrals” → https://referrals.live/ (homepage capture)`,
    `- “Browse the category picks” → https://referrals.live/browse?cat=${encodeURIComponent(primary)}`,
    `- “Submit a program we should cover” → https://referrals.live/submit`,
    ``,
    `## SEO checklist (fast wins)`,
    ``,
    `- Title uses: primary keyword + year + clear promise.`,
    `- H2s match People Also Ask: “Is it legit?”, “How long does payout take?”, “Requirements”, “Alternatives”.`,
    `- Add a short FAQ section and keep disclosures visible.`,
    `- Refresh monthly; finance/crypto offers change.`,
    ``,
    `---`,
    `Want more? Start at https://referrals.live/blog and publish one DRI post per day.`,
  ].join("\n");

  const id = crypto.randomUUID();
  const publishedAt = ts;
  await env.DB.prepare(
    `INSERT INTO blog_posts
     (id, slug, title, excerpt, content_md, keywords_json, hero_video_src, hero_video_label, hero_video_attribution_label, hero_video_attribution_href, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      title,
      excerpt,
      body,
      JSON.stringify(keywords),
      video.src,
      video.label,
      video.attributionLabel,
      video.attributionHref,
      publishedAt,
      ts,
      ts,
    )
    .run();
}

async function attributableDiscovery(env: Env, limit = 6) {
  const rows = await env.DB.prepare(
    `SELECT i.id, i.title, i.description, i.url, i.category, i.tags_json, i.image_url, i.created_at, i.score
     FROM ingested_offers i
     JOIN owner_attribution oa ON REPLACE(REPLACE(LOWER(substr(i.url, instr(i.url, '//') + 2)), 'www.', ''), '/', '') LIKE '%' || oa.domain || '%'
     ORDER BY i.score DESC, i.updated_at DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all<any>();
  return rows.results ?? [];
}

async function generateHealthReport(env: Env) {
  const ts = now();
  const db = env.DB;

  // 1. Revenue (Sum of completed conversions in last 7 days)
  const revenueRow = await db.prepare(
    "SELECT SUM(amount_cents) as total FROM conversions WHERE status = 'completed' AND created_at > ?"
  ).bind(ts - 7 * 24 * 60 * 60 * 1000).first<any>();
  const weeklyRevenue = (revenueRow?.total ?? 0) / 100;

  // 2. Leads (Count of new conversions/leads in last 7 days)
  const leadsRow = await db.prepare(
    "SELECT COUNT(*) as count FROM conversions WHERE created_at > ?"
  ).bind(ts - 7 * 24 * 60 * 60 * 1000).first<any>();
  const weeklyLeads = leadsRow?.count ?? 0;

  // 3. Signups (New users in last 7 days)
  const signupsRow = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE created_at > ?"
  ).bind(ts - 7 * 24 * 60 * 60 * 1000).first<any>();
  const weeklySignups = signupsRow?.count ?? 0;

  // Golden Triangle Health Score (Simplified: Avg of growth rates or just a weighted sum)
  const healthScore = Math.min(100, (weeklyRevenue / 100) + (weeklyLeads * 2) + (weeklySignups * 5));

  const report = {
    weeklyRevenue,
    weeklyLeads,
    weeklySignups,
    healthScore: healthScore.toFixed(1),
    timestamp: new Date(ts).toISOString()
  };

  console.info("Golden Triangle Health Report:", report);

  // Send to owner if configured
  const owner = await db.prepare("SELECT owner_email FROM owner_profile WHERE id='owner'").first<any>();
  if (owner?.owner_email) {
     // Trigger email via Resend/SendGrid if keys exist in env
  }
}

async function hourlyDiscovery(env: Env) {
  const ts = now();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return;

  const prompt = `Identify one high-quality, popular referral program that is NOT in this list: Dropbox, Wise, Shopify, Airbnb, Uber, Amazon. 
Return the result as a valid JSON object with:
- title: Program name
- description: Brief summary
- url: Official program URL
- category: finance|tech|travel|shopping|saas|crypto
- signup_requirements: What is needed to join
- reward_payout: What the referrer gets
- image_url: A relevant Unsplash URL

Only return JSON.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const result = await response.json() as any;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return;
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const p = JSON.parse(jsonMatch[0]);

    const id = `auto-${slugify(p.title)}`;
    
    // Check if already exists
    const exists = await env.DB.prepare("SELECT id FROM ingested_offers WHERE id=?").bind(id).first();
    if (exists) return;

    await env.DB.prepare(
      `INSERT INTO ingested_offers 
       (id, source, source_url, canonical_key, title, description, url, category, tags_json, image_url, score, created_at, updated_at)
       VALUES (?, 'auto_discovery', ?, ?, ?, ?, ?, ?, '[]', ?, 75, ?, ?)`
    ).bind(id, p.url, `auto:${id}`, p.title, p.description, p.url, p.category, p.image_url || "", ts, ts).run();

    // Create admin task
    await env.DB.prepare(
      `INSERT INTO admin_tasks (id, type, title, description, metadata_json, created_at, updated_at)
       VALUES (?, 'manual_signup', ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      `New Program: ${p.title}`,
      `Please sign up for ${p.title} to get your referral link. Requirements: ${p.signup_requirements}. Reward: ${p.reward_payout}.`,
      JSON.stringify({ url: p.url, requirements: p.signup_requirements, rewards: p.reward_payout }),
      ts,
      ts
    ).run();

    console.info(`Discovered new program: ${p.title}`);
  } catch (err) {
    console.error("Hourly discovery failed:", err);
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(upsert(env));
    ctx.waitUntil(ensureDailyBlogPost(env));
    ctx.waitUntil(hourlyDiscovery(env));
    
    const date = new Date(event.scheduledTime);
    if (date.getUTCDay() === 1 && date.getUTCHours() === 8) {
      ctx.waitUntil(generateHealthReport(env));
    }
  },
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/chat" || url.pathname.startsWith("/chat/")) {
      const id = env.CHAT.idFromName("global");
      return env.CHAT.get(id).fetch(request);
    }
    return new Response("ok", { status: 200 });
  },
};

export class ChatRoom {
  state: DurableObjectState;
  env: Env;
  sockets: Set<WebSocket>;
  socketCanPost: WeakMap<WebSocket, boolean>;
  socketLastSent: WeakMap<WebSocket, number>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();
    this.socketCanPost = new WeakMap();
    this.socketLastSent = new WeakMap();
    this.state.blockConcurrencyWhile(async () => {
      // Seed a small, clearly-labeled system intro if empty.
      const existing = await this.state.storage.get<string>("seeded");
      if (!existing) {
        const ts = Date.now();
      const seed = [
          { id: crypto.randomUUID(), ts, user: "Referrals.live Guide", role: "system", text: "Welcome to Referrals.live Live Chat. Read-only for free users; Premium members can post.", avatar: "wave", color: "electric" },
          { id: crypto.randomUUID(), ts: ts + 1, user: "Referrals.live Guide", role: "system", text: "Tip: Click any offer to open the tracked redirect. Upvote the ones you want us to surface more.", avatar: "wave", color: "electric" },
          { id: crypto.randomUUID(), ts: ts + 2, user: "CommunityBot (BOT)", role: "bot", text: "New here? Say hi after you upgrade. Tell the room what niche you’re in (fintech/crypto/saas/travel).", avatar: "spark", color: "neon" },
          { id: crypto.randomUUID(), ts: ts + 3, user: "CommunityBot (BOT)", role: "bot", text: "Reminder: only share official program pages or your own verified referral links. Keep it PG-13.", avatar: "spark", color: "neon" },
        ];
        await this.state.storage.put("messages", seed);
        await this.state.storage.put("seeded", "1");
      }
      const alarm = await this.state.storage.get<number>("nextAlarm");
      if (!alarm) {
        const next = Date.now() + 15 * 60 * 1000;
        await this.state.storage.put("nextAlarm", next);
        await this.state.storage.setAlarm(next);
      }
    });
  }

  cookie(request: Request, name: string) {
    const cookie = request.headers.get("Cookie") ?? "";
    const parts = cookie.split(";").map((p) => p.trim());
    for (const p of parts) {
      const idx = p.indexOf("=");
      if (idx === -1) continue;
      const k = p.slice(0, idx).trim();
      if (k !== name) continue;
      return decodeURIComponent(p.slice(idx + 1));
    }
    return null;
  }

  async canPostFromRequest(request: Request) {
    const sessionId = this.cookie(request, "rl_session");
    if (!sessionId) return false;
    const ts = Date.now();
    const row = await this.env.DB.prepare(
      "SELECT s.id as sid, u.id as uid, sub.status as sub_status, sub.current_period_end as cpe FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN subscriptions sub ON sub.user_id=u.id WHERE s.id=? AND s.expires_at>? LIMIT 1",
    )
      .bind(sessionId, ts)
      .first<any>();
    if (!row) return false;
    const premium = row.sub_status === "active" && (!row.cpe || Number(row.cpe) > ts);
    return Boolean(premium);
  }

  scrub(text: string) {
    const t = text.trim().slice(0, 500);
    const blocked = ["porn", "sex", "nazi", "hitler", "kill", "suicide", "rape"];
    const lower = t.toLowerCase();
    if (blocked.some((w) => lower.includes(w))) return "Message removed by moderation.";
    return t;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/chat/ws") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      server.accept();
      this.sockets.add(server);
      const canPost = await this.canPostFromRequest(request);
      this.socketCanPost.set(server, canPost);

      const msgs = ((await this.state.storage.get<ChatStoredMessage[]>("messages")) ?? []);
      server.send(JSON.stringify({ type: "init", messages: msgs.slice(-50) }));
      server.send(JSON.stringify({ type: "cap", canPost }));
      const broadcastPresence = () => {
        const payload = JSON.stringify({ type: "presence", count: this.sockets.size });
        for (const ws of this.sockets) {
          try {
            ws.send(payload);
          } catch {}
        }
      };
      broadcastPresence();

      server.addEventListener("message", (evt) => {
        try {
          const data = JSON.parse(String((evt as MessageEvent).data));
          if (!data?.type) return;
          const canPost = this.socketCanPost.get(server);

          if (data.type === "typing") {
            if (!canPost) return;
            const user = String(data.user ?? "anon").slice(0, 32);
            if (!user) return;
            const payload = JSON.stringify({ type: "typing", user });
            for (const ws of this.sockets) {
              if (ws === server) continue;
              try {
                ws.send(payload);
              } catch {}
            }
            return;
          }

          if (data.type === "react") {
            if (!canPost) return;
            const msgId = String(data.messageId ?? "");
            const emoji = String(data.emoji ?? "");
            const user = String(data.user ?? "anon").slice(0, 32);
            if (!msgId || !emoji || !user) return;
            if (!ALLOWED_REACTIONS.includes(emoji)) return;
            this.state.blockConcurrencyWhile(async () => {
              const existing = (await this.state.storage.get<ChatStoredMessage[]>("messages")) ?? [];
              const idx = existing.findIndex((m) => m.id === msgId);
              if (idx < 0) return;
              const target = { ...existing[idx]! };
              const reactions = { ...(target.reactions ?? {}) } as Record<string, string[]>;
              const list = reactions[emoji] ?? [];
              const has = list.includes(user);
              reactions[emoji] = has ? list.filter((u) => u !== user) : [...list, user].slice(0, 99);
              if (!reactions[emoji].length) delete reactions[emoji];
              target.reactions = reactions;
              const next = [...existing];
              next[idx] = target;
              await this.state.storage.put("messages", next);
              const payload = JSON.stringify({ type: "react", messageId: msgId, reactions });
              for (const ws of this.sockets) {
                try {
                  ws.send(payload);
                } catch {}
              }
            }).catch(() => null);
            return;
          }

          if (data.type !== "msg") return;
          if (!canPost) return;
          // Basic per-socket rate limit
          const now = Date.now();
          const last = this.socketLastSent.get(server) ?? 0;
          if (now - last < 800) return;
          this.socketLastSent.set(server, now);
          const message: ChatStoredMessage = {
            id: crypto.randomUUID(),
            ts: now,
            user: String(data.user ?? "anon").slice(0, 32),
            role: String(data.role ?? "member"),
            text: this.scrub(String(data.text ?? "")),
            avatar: String(data.avatar ?? "spark").slice(0, 16),
            color: String(data.color ?? "neon").slice(0, 16),
          };
          if (!message.text.trim()) return;
          // No deception: only allow system/guide messages from server-side seeds.
          if (message.role === "system" || message.role === "bot") return;

          this.state.blockConcurrencyWhile(async () => {
            const existing = (await this.state.storage.get<any[]>("messages")) ?? [];
            const next = [...existing, message].slice(-200);
            await this.state.storage.put("messages", next);
          }).catch(() => null);

          const payload = JSON.stringify({ type: "msg", message });
          for (const ws of this.sockets) {
            try {
              ws.send(payload);
            } catch {}
          }
        } catch {}
      });

      server.addEventListener("close", () => {
        this.sockets.delete(server);
        const payload = JSON.stringify({ type: "presence", count: this.sockets.size });
        for (const ws of this.sockets) {
          try {
            ws.send(payload);
          } catch {}
        }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/chat/messages") {
      const msgs = ((await this.state.storage.get<ChatStoredMessage[]>("messages")) ?? []);
      return new Response(JSON.stringify({ ok: true, messages: msgs.slice(-50) }), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response("not found", { status: 404 });
  }

  async alarm() {
    const ts = Date.now();
    const trend = await this.env.DB.prepare(
      `SELECT r.title, COALESCE(m.votes,0) AS votes
       FROM referrals r
       LEFT JOIN referral_metrics m ON m.referral_id=r.id
       WHERE r.status='public'
       ORDER BY COALESCE(m.votes,0) DESC, COALESCE(m.clicks,0) DESC
       LIMIT 1`,
    ).first<any>();
    const botLines = trend?.title
      ? [
          `🔥 ${trend.title} just hit ${Number(trend.votes ?? 0)} votes and is trending now.`,
          `📈 ${trend.title} is getting the strongest community traction right now.`,
        ]
      : [
          "If you’ve got a good referral program page, drop it after you upgrade—mods keep it clean and high-signal.",
          "Pro tip: upvote the offers that actually convert for your niche so they stay on top.",
        ];
    const pick = botLines[Math.floor(ts / 2_700_000) % botLines.length]!;
    const message = { id: crypto.randomUUID(), ts, user: "CommunityBot (BOT)", role: "bot", text: pick, avatar: "spark", color: "neon" };
    const existing = ((await this.state.storage.get<ChatStoredMessage[]>("messages")) ?? []);
    const next = [...existing, message].slice(-200);
    await this.state.storage.put("messages", next);

    const payload = JSON.stringify({ type: "msg", message });
    for (const ws of this.sockets) {
      try {
        ws.send(payload);
      } catch {}
    }

    const nextAlarm = ts + 45 * 60 * 1000;
    await this.state.storage.put("nextAlarm", nextAlarm);
    await this.state.storage.setAlarm(nextAlarm);
  }
}
