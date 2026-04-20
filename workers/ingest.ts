export type Env = {
  DB: D1Database;
  CHAT: DurableObjectNamespace;
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
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/chat") {
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

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();
    this.state.blockConcurrencyWhile(async () => {
      // Seed a small, clearly-labeled system intro if empty.
      const existing = await this.state.storage.get<string>("seeded");
      if (!existing) {
        const ts = Date.now();
        const seed = [
          { id: crypto.randomUUID(), ts, user: "Referrals.live Guide", role: "system", text: "Welcome to Referrals.live Live Chat. Read-only for free users; Premium members can post." },
          { id: crypto.randomUUID(), ts: ts + 1, user: "Referrals.live Guide", role: "system", text: "Tip: Click any offer to open the tracked redirect. Upvote the ones you want us to surface more." },
        ];
        await this.state.storage.put("messages", seed);
        await this.state.storage.put("seeded", "1");
      }
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/chat/ws") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      server.accept();
      this.sockets.add(server);

      const msgs = (await this.state.storage.get<any[]>("messages")) ?? [];
      server.send(JSON.stringify({ type: "init", messages: msgs.slice(-50) }));

      server.addEventListener("message", (evt) => {
        try {
          const data = JSON.parse(String((evt as MessageEvent).data));
          if (data?.type !== "msg") return;
          const message = {
            id: crypto.randomUUID(),
            ts: Date.now(),
            user: String(data.user ?? "anon").slice(0, 32),
            role: String(data.role ?? "member"),
            text: String(data.text ?? "").slice(0, 500),
          };
          if (!message.text.trim()) return;
          // No deception: only allow system/guide messages from server-side seeds.
          if (message.role === "system") return;

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
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/chat/messages") {
      const msgs = (await this.state.storage.get<any[]>("messages")) ?? [];
      return new Response(JSON.stringify({ ok: true, messages: msgs.slice(-50) }), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response("not found", { status: 404 });
  }
}
