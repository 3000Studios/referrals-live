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
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function fromB64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password: string) {
  const iterations = 210_000;
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
  if (!Number.isFinite(iterations) || iterations < 50_000) return false;
  const salt = fromB64(saltB64);
  const expected = fromB64(hashB64);
  const derived = await pbkdf2Hash(password, salt, iterations);
  if (derived.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < derived.length; i += 1) diff |= derived[i] ^ expected[i];
  return diff === 0;
}
