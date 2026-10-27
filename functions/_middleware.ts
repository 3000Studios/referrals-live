// A program id is real exactly when /api/programs/:id would find it: a
// public (or actively featured) row in `referrals`, or a row in
// `ingested_offers`. Mirror that lookup so unknown /program/<id> paths get
// a genuine 404 instead of the SPA shell with HTTP 200 (a soft 404 caused
// by the /program/* splat rewrite in _redirects, which exists so D1-only
// program ids still boot the app). Prerendered program pages pass this
// check too — every prerendered id is in the catalog — and their shield
// rules in _redirects still serve their static HTML via next().
async function programExists(env: any, id: string): Promise<boolean> {
  const ts = Date.now();
  const referral = await env.DB.prepare(
    `SELECT r.id
     FROM referrals r
     LEFT JOIN featured_slots f ON f.referral_id=r.id AND f.ends_at>?
     WHERE r.id=? AND (r.status='public' OR f.referral_id IS NOT NULL)
     LIMIT 1`,
  )
    .bind(ts, id)
    .first();
  if (referral) return true;
  const ingested = await env.DB.prepare("SELECT id FROM ingested_offers WHERE id=? LIMIT 1")
    .bind(id)
    .first();
  return !!ingested;
}

// Serve the generated 404.html (app shell carrying not-found title/meta and
// crawlable not-found copy) with a genuine 404 status.
async function notFound(context: any) {
  try {
    const asset = await context.env.ASSETS.fetch(
      new Request(new URL("/404.html", context.request.url)),
    );
    if (asset.status === 200) {
      return new Response(asset.body, { status: 404, headers: asset.headers });
    }
  } catch {
    // ASSETS unavailable — fall back to the shell body with a 404 status.
  }
  const shell = await context.next();
  return new Response(shell.body, { status: 404, headers: shell.headers });
}

export async function onRequest(context: any) {
  // www serves a byte-identical duplicate of the apex — permanently redirect
  // it to the apex, preserving path and query, so only https://referrals.live
  // is ever served or indexed.
  const url = new URL(context.request.url);
  if (url.hostname === "www.referrals.live") {
    return Response.redirect(`https://referrals.live${url.pathname}${url.search}`, 301);
  }

  // Program soft-404 guard: only a single-segment /program/<id> whose id is
  // in the catalog may proceed to the splat rewrite / shield rules. On any
  // lookup error, fail open (next()) so a transient DB problem can never
  // take a real program page down.
  if (context.request.method === "GET" || context.request.method === "HEAD") {
    const match = url.pathname.match(/^\/program\/(.+)$/);
    if (match) {
      const segment = match[1].endsWith("/") ? match[1].slice(0, -1) : match[1];
      let invalid = segment === "" || segment.includes("/");
      if (!invalid) {
        let id = segment;
        try {
          id = decodeURIComponent(segment);
        } catch {
          // Keep the raw segment; the lookup simply will not match.
        }
        try {
          invalid = !(await programExists(context.env, id));
        } catch {
          invalid = false;
        }
      }
      if (invalid) return notFound(context);
    }
  }

  const response = await context.next();
  // Ensure API responses are not cached by edge/CDN.
  if (context.request.url.includes("/api/") || context.request.url.includes("/go/")) {
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}
