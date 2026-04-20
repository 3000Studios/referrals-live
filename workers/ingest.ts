export type Env = {
  DB: D1Database;
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

async function upsert(env: Env) {
  const ts = now();
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
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(upsert(env));
  },
  async fetch() {
    return new Response("ok", { status: 200 });
  },
};

