/**
 * Pages direct upload + deployment (avoids wrangler project GET when API is rate-limited).
 * Requires PAGES_UPLOAD_JWT from GET .../upload-token.
 * Deployment auth: CLOUDFLARE_API_TOKEN, or Wrangler oauth_token in ~/.wrangler/config/default.toml
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "blake3-wasm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const API = "https://api.cloudflare.com/client/v4";
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID ?? "d6ec056b27a57bcf807a46b2e3379d60";
const PROJECT = process.env.CF_PAGES_PROJECT ?? "referrals-live";

const IGNORE = new Set(["node_modules", ".DS_Store", ".git"]);

function hashFile(fp) {
  const contents = fs.readFileSync(fp);
  const base64Contents = contents.toString("base64");
  const ext = path.extname(fp).substring(1);
  return hash(base64Contents + ext).toString("hex").slice(0, 32);
}

function shouldSkip(rel) {
  if (rel.startsWith(".") && !rel.startsWith(".well-known")) return true;
  return false;
}

function walkFiles(dir, base = dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.relative(base, full).split(path.sep).join("/");
    if (shouldSkip(rel)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walkFiles(full, base, out);
    else {
      const lower = name.toLowerCase();
      const contentType = lower.endsWith(".html")
        ? "text/html; charset=utf-8"
        : lower.endsWith(".css")
          ? "text/css; charset=utf-8"
          : lower.endsWith(".js")
            ? "application/javascript"
            : lower.endsWith(".svg")
              ? "image/svg+xml"
              : "application/octet-stream";
      out.push({
        rel,
        full,
        hash: hashFile(full),
        sizeInBytes: st.size,
        contentType,
      });
    }
  }
  return out;
}

async function apiResult(resource, init = {}) {
  const res = await fetch(`${API}${resource}`, init);
  const json = await res.json();
  if (!json.success) {
    throw new Error(`CF API ${resource}: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.result;
}

function readWranglerOauth() {
  try {
    const p = path.join(os.homedir(), ".wrangler", "config", "default.toml");
    const t = fs.readFileSync(p, "utf-8");
    const m = t.match(/oauth_token\s*=\s*"([^"]+)"/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const jwt = process.env.PAGES_UPLOAD_JWT;
  if (!jwt) {
    console.error("Set PAGES_UPLOAD_JWT (from upload-token endpoint).");
    process.exit(1);
  }
  if (!fs.existsSync(DIST)) {
    console.error("dist/ missing — run npm run build first.");
    process.exit(1);
  }

  const files = walkFiles(DIST);
  const missingHashes = await apiResult("/pages/assets/check-missing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ hashes: files.map((f) => f.hash) }),
  });

  const need = files.filter((f) => missingHashes.includes(f.hash));
  console.log(`Uploading ${need.length} of ${files.length} asset(s)…`);

  const MAX_BUCKET = 40 * 1024 * 1024;
  const buckets = [];
  let cur = { files: [], size: 0 };
  for (const f of need.sort((a, b) => b.sizeInBytes - a.sizeInBytes)) {
    if (cur.files.length && (cur.size + f.sizeInBytes > MAX_BUCKET || cur.files.length >= 1000)) {
      buckets.push(cur);
      cur = { files: [], size: 0 };
    }
    cur.files.push(f);
    cur.size += f.sizeInBytes;
  }
  if (cur.files.length) buckets.push(cur);

  for (const bucket of buckets) {
    const payload = bucket.files.map((file) => ({
      key: file.hash,
      value: fs.readFileSync(file.full).toString("base64"),
      metadata: { contentType: file.contentType },
      base64: true,
    }));
    await apiResult("/pages/assets/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(payload),
    });
  }

  await apiResult("/pages/assets/upsert-hashes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ hashes: files.map((f) => f.hash) }),
  });

  const manifest = Object.fromEntries(files.map((f) => [`/${f.rel}`, f.hash]));
  const form = new FormData();
  form.append("manifest", JSON.stringify(manifest));
  form.append("commit_dirty", "true");

  const redirectsPath = path.join(DIST, "_redirects");
  if (fs.existsSync(redirectsPath)) {
    const text = fs.readFileSync(redirectsPath, "utf-8");
    form.append("_redirects", new File([text], "_redirects", { type: "text/plain" }));
  }

  const candidates = [...new Set([process.env.CLOUDFLARE_API_TOKEN, readWranglerOauth(), jwt].filter(Boolean))];
  let depJson = { success: false };
  for (const tok of candidates) {
    const r = await fetch(`${API}/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/deployments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
      body: form,
    });
    depJson = await r.json();
    if (depJson.success) break;
  }

  if (!depJson.success) {
    console.error(depJson);
    throw new Error("Deployment request failed (try CLOUDFLARE_API_TOKEN or wrangler login)");
  }
  const url = depJson.result?.url ?? depJson.result?.aliases?.[0];
  console.log("Success:", url ?? JSON.stringify(depJson.result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
