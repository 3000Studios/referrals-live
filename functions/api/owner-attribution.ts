import type { Env } from "./_lib";
import { json, now, parseJson, uid } from "./_lib";

type Entry = { domain: string; params: Record<string, string> };

export async function onRequestGet(context: { request: Request; env: Env }) {
  const rows = await context.env.DB.prepare("SELECT domain, params_json, updated_at FROM owner_attribution ORDER BY domain ASC").all<any>();
  const items = (rows.results ?? []).map((r: any) => ({
    domain: r.domain,
    params: JSON.parse(r.params_json ?? "{}"),
    updatedAt: Number(r.updated_at),
  }));
  return json({ ok: true, items });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const body = await parseJson<Entry>(context.request);
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const params = body.params ?? {};
  if (!domain || domain.includes("/") || domain.includes(" ")) return json({ ok: false, error: "Invalid domain" }, { status: 400 });
  const clean: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    const key = String(k).trim();
    const val = String(v ?? "").trim();
    if (!key || !val) return;
    clean[key] = val;
  });
  await context.env.DB.prepare(
    "INSERT OR REPLACE INTO owner_attribution (id, domain, params_json, updated_at) VALUES (COALESCE((SELECT id FROM owner_attribution WHERE domain=?), ?), ?, ?, ?)",
  )
    .bind(domain, uid("attr"), domain, JSON.stringify(clean), now())
    .run();
  return json({ ok: true });
}

