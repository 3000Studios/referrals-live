import type { Provider } from "@/types";

export type AttributionResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

export function providerForUrl(providers: Provider[], url: string): Provider | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return providers.find((p) => host.endsWith(p.domain));
  } catch {
    return undefined;
  }
}

export function validateRequiredParams(provider: Provider, params: Record<string, string>): string[] {
  return provider.requiredParams.filter((k) => !params[k]?.trim());
}

function interpolate(template: string, tokenMap: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => tokenMap[key] ?? "");
}

export function buildAttributedUrl(
  provider: Provider,
  sourceUrl: string,
  ownerParams: Record<string, string>,
): AttributionResult {
  const missing = validateRequiredParams(provider, ownerParams);
  if (missing.length) {
    return { ok: false, reason: `Missing owner params: ${missing.join(", ")}` };
  }

  let source: URL;
  try {
    source = new URL(sourceUrl);
  } catch {
    return { ok: false, reason: "Invalid source URL" };
  }

  const tokenMap: Record<string, string> = {
    ...ownerParams,
    path: source.pathname.replace(/^\//, ""),
    host: source.host,
    source_url: source.toString(),
  };

  let candidate = interpolate(provider.attributionTemplate, tokenMap);
  if (!candidate.startsWith("http://") && !candidate.startsWith("https://")) {
    candidate = `https://${candidate}`;
  }

  try {
    const out = new URL(candidate);
    out.searchParams.set("utm_source", "referrals_live");
    out.searchParams.set("utm_medium", "curated_public");
    out.searchParams.set("utm_campaign", "owner_attribution");
    return { ok: true, url: out.toString() };
  } catch {
    return { ok: false, reason: "Attribution template produced invalid URL" };
  }
}

