// Emits dist/404.html from the built SPA shell (dist/index.html).
//
// Why: Cloudflare Pages serves /index.html with HTTP 200 for every unmatched
// path while no 404.html exists (the _redirects catch-all is ignored by
// Pages' validator as an "infinite loop"). With a 404.html present, Pages
// serves it with a genuine 404 status for unmatched paths. The file is the
// app shell — so React still boots and renders its own NotFound page — with
// not-found title/meta, no canonical, and a crawlable content block inside
// #root (replaced by React on mount) carrying the NotFound page's own copy.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(repoRoot, 'dist')
const shellPath = path.join(distRoot, 'index.html')
const outPath = path.join(distRoot, '404.html')

const TITLE = 'Page Not Found | referrals.live'
const DESCRIPTION = 'Page not found.'

const contentBlock = `<main>
      <h1>This page drifted off-chain</h1>
      <p>The route doesn't exist (yet). Head back to the marketplace.</p>
      <p><a href="/">Go home</a> · <a href="/browse">Browse programs</a> · <a href="/categories">Categories</a> · <a href="/leaderboard">See the leaderboard</a> · <a href="/about">About referrals.live</a></p>
    </main>`

let html = fs.readFileSync(shellPath, 'utf8')

html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`)
html = html.replace(
  /<meta name="description" content="[^"]*"\s*\/?>/,
  `<meta name="description" content="${DESCRIPTION}" />`,
)
html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${TITLE}" />`)
html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${DESCRIPTION}" />`)
html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${TITLE}" />`)
html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${DESCRIPTION}" />`)
// A 404 page must not canonicalize itself to the homepage or claim its URL.
html = html.replace(/\s*<link rel="canonical"[^>]*>/, '')
html = html.replace(/\s*<meta property="og:url"[^>]*>/, '')
if (/<meta name="robots"[^>]*>/.test(html)) {
  html = html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />')
} else {
  html = html.replace('</title>', '</title>\n    <meta name="robots" content="noindex, follow" />')
}
// Crawlable not-found content inside #root; React replaces it on mount.
html = html.replace(/(<div id="root">)/, `$1${contentBlock}`)

fs.writeFileSync(outPath, html)
console.log(`generate-404: wrote ${path.relative(repoRoot, outPath)} (${Buffer.byteLength(html)} bytes)`)

// ---------- program shields in dist/_redirects ----------
//
// Pages redirect rules are ALWAYS followed, even when a static asset
// matches the request (Pages docs). The `/program/* -> /` rewrite in
// public/_redirects exists so program pages for ids that live only in
// the D1 catalog (created after the prerender snapshot) still boot the
// app, which fetches them from /api/programs/:id — but unshielded it
// would also shadow every prerendered /program/<id> page. So for each
// program the prerender actually emitted, prepend an exact rule that
// rewrites the bare and trailing-slash paths to the page's own
// directory index; exact rules are listed first and win over the splat.
// Verified in the local Pages runtime: shielded ids serve their own
// prerendered page, unshielded ids serve the app shell, dead paths 404.
const redirectsPath = path.join(distRoot, '_redirects')
const programRoot = path.join(distRoot, 'program')
const BEGIN = '# --- BEGIN generated program shields (scripts/generate-404.mjs) ---'
const END = '# --- END generated program shields ---'
if (fs.existsSync(redirectsPath) && fs.existsSync(programRoot)) {
  const ids = fs
    .readdirSync(programRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(programRoot, e.name, 'index.html')))
    .map((e) => e.name)
    .sort()
  const shields = [
    BEGIN,
    '# Exact rewrites so prerendered program pages win over the /program/* splat.',
    ...ids.flatMap((id) => [`/program/${id} /program/${id}/ 200`, `/program/${id}/ /program/${id}/ 200`]),
    END,
    '',
  ].join('\n')
  let current = fs.readFileSync(redirectsPath, 'utf8')
  const prior = new RegExp(`${BEGIN}[\\s\\S]*?${END}\\n?`, 'g')
  current = current.replace(prior, '')
  fs.writeFileSync(redirectsPath, shields + current)
  console.log(`generate-404: prepended ${ids.length * 2} program shield rules (${ids.length} programs) to dist/_redirects`)
}
