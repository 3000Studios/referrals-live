export type Env = {
  DB: D1Database;
  CHAT: DurableObjectNamespace;
};

type ChatStoredMessage = {
  id: string;
  ts: number;
  user: string;
  role: string;
  text: string;
  avatar?: string;
  color?: string;
};

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
    imageUrl: "https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=1200&q=80",
    score: 90,
  },
  {
    id: "ref-wise",
    title: "Wise — Invite Friends Help",
    description: "How Wise friend invites work (official help center).",
    url: "https://wise.com/help/articles/2978044/invite-friends-to-wise",
    category: "fintech",
    tags: ["money", "international", "invite"],
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    score: 86,
  },
  {
    id: "ref-shopify",
    title: "Shopify — Affiliate Program",
    description: "Promote Shopify and earn commissions (official affiliate program page).",
    url: "https://www.shopify.com/affiliates",
    category: "ecommerce",
    tags: ["ecommerce", "affiliate", "saas"],
    imageUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80",
    score: 92,
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
    src: "https://cdn.coverr.co/videos/coverr-typing-on-a-laptop-9718/1080p.mp4",
    label: "Auto-play video: typing on a laptop",
    attributionLabel: "Video source: Coverr (free license)",
    attributionHref: "https://coverr.co/",
  },
  {
    src: "https://cdn.coverr.co/videos/coverr-a-woman-working-on-her-laptop-3419/1080p.mp4",
    label: "Auto-play video: working on a laptop",
    attributionLabel: "Video source: Coverr (free license)",
    attributionHref: "https://coverr.co/",
  },
  {
    src: "https://cdn.coverr.co/videos/coverr-hand-scrolling-on-a-phone-4487/1080p.mp4",
    label: "Auto-play video: scrolling on a phone",
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
  const apiKey = (env as any).GEMINI_API_KEY;
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
          if (data?.type !== "msg") return;
          if (!this.socketCanPost.get(server)) return;
          // Basic per-socket rate limit
          const now = Date.now();
          const last = this.socketLastSent.get(server) ?? 0;
          if (now - last < 800) return;
          this.socketLastSent.set(server, now);
          const message = {
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
    const pick = botLines[Math.floor(Math.random() * botLines.length)]!;
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
