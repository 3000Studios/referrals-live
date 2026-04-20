export async function onRequest(context: any) {
  const response = await context.next();
  // Ensure API responses are not cached by edge/CDN.
  if (context.request.url.includes("/api/") || context.request.url.includes("/go/")) {
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

