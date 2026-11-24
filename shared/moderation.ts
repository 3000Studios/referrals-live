/**
 * Shared moderation rules for referrals.live — used by the chat client,
 * the chat room (Durable Object), and the listing API, so every surface
 * enforces the same policy.
 *
 * Policy in short:
 * - Chat is for talking. Links in chat may only point at referrals.live
 *   pages (a member shares their listing, not a raw affiliate URL).
 * - Listings must be https, not a link shortener, not an IP address, not
 *   carrying credentials, and not a page on referrals.live itself.
 * - Obvious scam phrasing (guaranteed returns, seed phrases, "DM me on
 *   Telegram") and a short list of abusive terms are refused everywhere.
 * Matching uses whole words, so "skill" or "Essex" never trip a filter.
 */

export type Verdict = { ok: true } | { ok: false; reason: string };

const BLOCKED_WORDS = [
  "nazi",
  "hitler",
  "rape",
  "rapist",
  "porn",
  "porno",
  "nsfw",
  "onlyfans",
  "kys",
  "pedo",
  "retard",
];

const SCAM_PATTERNS: RegExp[] = [
  /\bguaranteed\s+(profit|profits|returns?|income|payout)\b/i,
  /\bdouble\s+your\s+(money|crypto|btc|bitcoin|eth|investment)\b/i,
  /\b(seed|recovery)\s+phrase\b/i,
  /\bprivate\s+key\b/i,
  /\b(dm|message|text|contact)\s+me\s+(on|at|via)\s+(whatsapp|telegram|signal)\b/i,
  /\b(whatsapp|telegram)\s*[:@]\s*\+?\d/i,
  /\bsend\s+(me\s+)?(btc|bitcoin|eth|usdt|crypto)\b/i,
  /\bwire\s+me\b/i,
  /\bgift\s*cards?\s+(only|as\s+payment)\b/i,
  /\bpassword\b.*\b(send|share|give)\b/i,
];

export const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "bitly.com",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rebrand.ly",
  "shorturl.at",
  "tiny.cc",
  "rb.gy",
  "t.ly",
  "s.id",
  "v.gd",
  "lnkd.in",
  "shorte.st",
  "adf.ly",
  "bc.vc",
  "ouo.io",
  "linktr.ee",
]);

const SITE_HOSTS = new Set(["referrals.live", "www.referrals.live"]);

// Full URLs, www. hosts, and bare domains with any 2-24 letter ending
// ("scam.shop", "evil.ru/x"). Bare words like "node.js" also match; that
// only means a free member's message waits for a referrals.live-only check.
const URL_RE = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+|\b(?:[a-z0-9-]+\.)+[a-z]{2,24}\b(?:\/[^\s<>"']*)?/gi;

export function findUrls(text: string): string[] {
  return Array.from(text.matchAll(URL_RE)).map((m) => m[0]);
}

function hostOf(raw: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.toLowerCase().replace(/\.+$/, "");
  } catch {
    return null;
  }
}

function hasBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, "i").test(lower));
}

function looksLikeScam(text: string): boolean {
  return SCAM_PATTERNS.some((re) => re.test(text));
}

function isShouting(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 14) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.75;
}

export const CHAT_MAX_LENGTH = 400;

/** Checks one chat message. Returns the trimmed text when it passes. */
export function checkChatText(raw: string): Verdict & { text?: string } {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "Type a message first." };
  if (text.length > CHAT_MAX_LENGTH) return { ok: false, reason: `Keep messages under ${CHAT_MAX_LENGTH} characters.` };
  if (hasBlockedWord(text)) return { ok: false, reason: "That message breaks the chat rules." };
  if (looksLikeScam(text)) return { ok: false, reason: "That looks like a scam pattern, so it wasn't sent." };
  if (isShouting(text)) return { ok: false, reason: "Please don't post in all caps." };
  if (/(.)\1{11,}/.test(text)) return { ok: false, reason: "Please don't spam repeated characters." };
  for (const u of findUrls(text)) {
    const host = hostOf(u);
    if (!host || !SITE_HOSTS.has(host)) {
      return {
        ok: false,
        reason: "Share outside links as a listing from your dashboard. Chat links can only point to referrals.live pages.",
      };
    }
  }
  return { ok: true, text };
}

export type ListingInput = { title: string; description: string; url: string; imageUrl: string };

function checkHttpsUrl(raw: string, label: string): Verdict {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: `${label} must be a full https:// address.` };
  }
  if (u.protocol !== "https:") return { ok: false, reason: `${label} must start with https://.` };
  if (u.username || u.password) return { ok: false, reason: `${label} can't contain a username or password.` };
  const host = u.hostname.toLowerCase();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":") || host === "localhost") {
    return { ok: false, reason: `${label} must use a real domain name.` };
  }
  if (raw.length > 600) return { ok: false, reason: `${label} is too long.` };
  return { ok: true };
}

/** Checks a member's listing before it is saved. */
export function checkListing(input: ListingInput): Verdict {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 4 || title.length > 90) return { ok: false, reason: "Title should be 4 to 90 characters." };
  if (description.length < 20 || description.length > 500) {
    return { ok: false, reason: "Description should be 20 to 500 characters, so visitors know what they get." };
  }
  const urlCheck = checkHttpsUrl(input.url.trim(), "Referral link");
  if (!urlCheck.ok) return urlCheck;
  const imageCheck = checkHttpsUrl(input.imageUrl.trim(), "Image URL");
  if (!imageCheck.ok) return imageCheck;
  const host = new URL(input.url.trim()).hostname.toLowerCase().replace(/\.+$/, "").replace(/^www\./, "");
  if (SHORTENER_HOSTS.has(host)) {
    return { ok: false, reason: "Link shorteners aren't allowed. Paste the program's full referral link." };
  }
  if (SITE_HOSTS.has(host) || host === "referrals.live") {
    return { ok: false, reason: "Paste the program's own referral link, not a referrals.live page." };
  }
  const text = `${title} ${description}`;
  if (hasBlockedWord(text)) return { ok: false, reason: "That listing breaks the content rules." };
  if (looksLikeScam(text)) return { ok: false, reason: "That listing reads like a scam pattern, so it can't be posted." };
  if (isShouting(title)) return { ok: false, reason: "Please don't write the title in all caps." };
  return { ok: true };
}

/** Normalizes a URL for duplicate checks (host, path and query, no hash). */
export function normalizeListingUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !/^utm_/i.test(k))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return `${host}${path}${params ? `?${params}` : ""}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}
