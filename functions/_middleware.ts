export async function onRequest(context: any) {
  // www serves a byte-identical duplicate of the apex — permanently redirect
  // it to the apex, preserving path and query, so only https://referrals.live
  // is ever served or indexed.
  const url = new URL(context.request.url);
  if (url.hostname === "www.referrals.live") {
    return Response.redirect(`https://referrals.live${url.pathname}${url.search}`, 301);
  }
  const response = await context.next();
  // Ensure API responses are not cached by edge/CDN.
  if (context.request.url.includes("/api/") || context.request.url.includes("/go/")) {
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}
