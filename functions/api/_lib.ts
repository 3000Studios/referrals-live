export type Env = {
  DB: D1Database;
  APP_ORIGIN: string;
  SESSION_DAYS?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(message: string) {
  return json({ ok: false, error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return json({ ok: false, error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return json({ ok: false, error: message }, { status: 404 });
}

export function serverError(message = "Server error") {
  return json({ ok: false, error: message }, { status: 500 });
}

export function now() {
  return Date.now();
}

export function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function parseJson<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}

export function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("Cookie") ?? "";
  const parts = cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (!p) continue;
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    if (k !== name) continue;
    return decodeURIComponent(p.slice(idx + 1));
  }
  return null;
}

export function setCookie(name: string, value: string, opts: { maxAgeSeconds: number }) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];
  return parts.join("; ");
}

export function clearCookie(name: string) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export async function pbkdf2Hash(password: string, saltBytes: Uint8Array, iterations: number) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function b64(bytes: Uint8Array) {
  const btoaFn = (globalThis as any).btoa as ((s: string) => string) | undefined;
  if (btoaFn) {
    let s = "";
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoaFn(s);
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += alphabet[(n >> 18) & 63]!;
    out += alphabet[(n >> 12) & 63]!;
    out += b == null ? "=" : alphabet[(n >> 6) & 63]!;
    out += c == null ? "=" : alphabet[n & 63]!;
  }
  return out;
}

function fromB64(s: string) {
  const atobFn = (globalThis as any).atob as ((s: string) => string) | undefined;
  if (atobFn) {
    const bin = atobFn(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i += 1) lookup.set(alphabet[i]!, i);
  const clean = s.replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let outIdx = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n1 = lookup.get(clean[i]!) ?? 0;
    const n2 = lookup.get(clean[i + 1]!) ?? 0;
    const n3 = lookup.get(clean[i + 2]!) ?? 0;
    const n4 = lookup.get(clean[i + 3]!) ?? 0;
    const n = (n1 << 18) | (n2 << 12) | (n3 << 6) | n4;
    out[outIdx++] = (n >> 16) & 255;
    if (clean[i + 2] != null) out[outIdx++] = (n >> 8) & 255;
    if (clean[i + 3] != null) out[outIdx++] = n & 255;
  }
  return out.slice(0, outIdx);
}

export async function hashPassword(password: string) {
  const iterations = 100_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2Hash(password, salt, iterations);
  return `pbkdf2$sha256$${iterations}$${b64(salt)}$${b64(derived)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 5) return false;
  const [scheme, algo, iter, saltB64, hashB64] = parts;
  if (scheme !== "pbkdf2" || algo !== "sha256") return false;
  const iterations = Number(iter);
  if (!Number.isFinite(iterations) || iterations < 50_000 || iterations > 100_000) return false;
  const salt = fromB64(saltB64);
  const expected = fromB64(hashB64);
  const derived = await pbkdf2Hash(password, salt, iterations);
  if (derived.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < derived.length; i += 1) diff |= derived[i] ^ expected[i];
  return diff === 0;
}
