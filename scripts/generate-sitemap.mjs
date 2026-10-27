// Generates dist/sitemap.xml at build time. This is the site's ONE sitemap
// mechanism (it replaces the hand-maintained public/sitemap.xml, which had
// drifted to zero /program/* URLs, and the shadowed functions/sitemap.xml.ts).
//
// Sources of truth — the same data the prerenderer and the app use:
// - the static page list below (the public routes in src/App.tsx)
// - src/data/blogArticles.ts (which merges newArticles.ts) for blog slugs
// - scripts/catalog.json for every public program page (/program/<id>/),
//   so the sitemap stays correct automatically as programs are added.
//
// Every <loc> uses the trailing-slash form the site actually serves
// (Cloudflare Pages 308s the no-slash form to it), matching the canonicals.
// <lastmod> is emitted only where the source data carries a real date
// (blog article dates) — never a fabricated one.
//
// Runs BEFORE scripts/prerender.mjs in the build: prerender discovers its
// routes by reading dist/sitemap.xml.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(repoRoot, 'dist')
const srcRoot = path.join(repoRoot, 'src')
const SITE_URL = 'https://referrals.live'

async function loadModule(entry) {
  const tmp = path.join(
    os.tmpdir(),
    `sitemap-${path.basename(entry, path.extname(entry))}-${process.pid}.mjs`,
  )
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: tmp,
    logLevel: 'silent',
    alias: { '@': srcRoot },
    define: { 'import.meta.env': '{}' },
  })
  try {
    return await import(pathToFileURL(tmp).href)
  } finally {
    fs.rmSync(tmp, { force: true })
  }
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const STATIC_PATHS = [
  '/',
  '/browse',
  '/categories',
  '/leaderboard',
  '/blog',
  '/premium',
  '/submit',
  '/testimonials',
  '/analytics',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclosure',
  '/disclaimer',
]

const locFor = (p) => (p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}/`)

const { blogArticles } = await loadModule(path.join(srcRoot, 'data', 'blogArticles.ts'))
const catalog = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'scripts', 'catalog.json'), 'utf8'),
)

const urls = []
for (const p of STATIC_PATHS) urls.push({ loc: locFor(p) })
for (const a of blogArticles) {
  const entry = { loc: locFor(`/blog/${encodeURIComponent(a.slug)}`) }
  // Article dates in the data are ISO dates (YYYY-MM-DD) — a real source date.
  if (typeof a.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(a.date)) {
    entry.lastmod = a.date.slice(0, 10)
  }
  urls.push(entry)
}
for (const p of catalog) urls.push({ loc: locFor(`/program/${encodeURIComponent(p.id)}`) })

const body =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(u.lastmod)}</lastmod>` : ''}</url>`,
    )
    .join('\n') +
  `\n</urlset>\n`

fs.writeFileSync(path.join(distRoot, 'sitemap.xml'), body)
console.log(
  `sitemap generated: ${urls.length} urls (${STATIC_PATHS.length} static, ${blogArticles.length} blog, ${catalog.length} programs)`,
)
