import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";

async function requireAdmin(request: Request, env: Env) {
  const user = await requireUser(request, env);
  if (!user) return { error: json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  if (!user.isAdmin) return { error: json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  return { user };
}

function normDomain(host: string) {
  return host.replace(/^www\./i, "").toLowerCase();
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const gate = await requireAdmin(context.request, context.env);
  if ("error" in gate) return gate.error;

  const [offers, configured] = await Promise.all([
    context.env.DB.prepare(
      `SELECT id, title, description, url, category, score, updated_at
       FROM ingested_offers
       ORDER BY score DESC, updated_at DESC
       LIMIT 120`,
    ).all<any>(),
    context.env.DB.prepare("SELECT domain FROM owner_attribution ORDER BY domain ASC").all<any>(),
  ]);

  const configuredSet = new Set((configured.results ?? []).map((r: any) => String(r.domain ?? "").toLowerCase()));

  const items = (offers.results ?? [])
    .map((r: any) => {
      const url = String(r.url ?? "");
      let domain = "";
      try {
        domain = normDomain(new URL(url).hostname);
      } catch {
        domain = "";
      }
      return {
        id: String(r.id),
        title: String(r.title),
        description: String(r.description),
        url,
        category: String(r.category),
        score: Number(r.score ?? 0),
        updatedAt: Number(r.updated_at ?? 0),
        domain,
        configured: domain ? configuredSet.has(domain) : false,
      };
    })
    .filter((x) => x.domain);

  return json({ ok: true, items });
}

