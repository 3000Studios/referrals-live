// Prerenders the public routes of the SPA into static HTML inside dist/ at
// build time, using the built SPA shell (dist/index.html) as the template.
// Crawlers and no-JS visitors get the real content — the referral-program
// listings, program detail pages, categories, and the full blog — in raw
// HTML; the React app still boots from the same shell and replaces #root on
// render, so the interactive experience is unchanged.
//
// Sources of truth (the same data the app serves):
// - scripts/catalog.json — snapshot of the public D1 catalog, reconstructed
//   from migrations/*.sql applied in order (status='public' rows, the exact
//   set GET /api/referrals returns for the seeded catalog).
// - src/data/blogArticles.ts + src/data/newArticles.ts — the blog.
// - src/data/categories.ts — the category list.
// - src/pages/*.tsx — static page copy and <Seo> meta.
// Outbound CTAs use /offer/:id exactly like the app (attribution is applied
// by that route at click time); titles link to /program/:id.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(repoRoot, 'dist')
const srcRoot = path.join(repoRoot, 'src')
const SITE_URL = 'https://referrals.live'

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function loadModule(entry) {
  const tmp = path.join(
    os.tmpdir(),
    `prerender-${path.basename(entry, path.extname(entry))}-${process.pid}.mjs`,
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

// ---------- JSX visible-text extraction (same approach as the fleet) ----------

function stripExpressions(src) {
  let out = ''
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === '{') {
      let depth = 0
      let j = i
      let str = null
      for (; j < src.length; j++) {
        const c = src[j]
        if (str) {
          if (c === '\\') j++
          else if (c === str) str = null
          continue
        }
        if (c === '"' || c === "'" || c === '`') str = c
        else if (c === '{') depth++
        else if (c === '}') {
          depth--
          if (depth === 0) break
        }
      }
      const inner = src.slice(i + 1, j).trim()
      const lit = inner.match(/^(['"])((?:\\.|(?!\1)[\s\S])*)\1$/)
      if (lit) out += lit[2].replace(/\\(['"])/g, '$1')
      else if (/^`[^`]*`$/.test(inner) && !inner.includes('${')) out += inner.slice(1, -1)
      else if (inner.includes('<')) {
        const first = inner.indexOf('<')
        const last = inner.lastIndexOf('>')
        if (last > first) out += stripExpressions(inner.slice(first, last + 1))
      }
      out += ' '
      i = j + 1
    } else {
      out += ch
      i++
    }
  }
  return out
}

function decodeEntities(t) {
  return t
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&nbsp;', ' ')
}

const BLOCK_TAGS = new Set([
  'p', 'li', 'div', 'section', 'article', 'blockquote', 'tr', 'label',
  'button', 'header', 'footer', 'main', 'td', 'th', 'option', 'figcaption',
])

function jsxBlocks(src) {
  const cleaned = stripExpressions(
    src
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' '),
  )
  const tokens = cleaned.split(/(<[^>]+>)/g)
  const blocks = []
  let level = 0
  let cur = ''
  const flush = () => {
    const t = decodeEntities(cur).replace(/\s+/g, ' ').trim()
    cur = ''
    if (t.length < 2) return
    if (!/[A-Za-z0-9]{2,}/.test(t)) return
    if (/^(import|export|const|let|var|function|return)\b/.test(t)) return
    if (t.includes('className') || t.includes('=>') || t.includes(');')) return
    if (blocks.length && blocks[blocks.length - 1].text === t) return
    blocks.push({ level, text: t })
  }
  for (const tok of tokens) {
    if (tok.startsWith('<')) {
      const m = tok.match(/^<\/?\s*([a-zA-Z][a-zA-Z0-9.]*)/)
      const tag = (m?.[1] ?? '').toLowerCase()
      const closing = tok.startsWith('</')
      if (/^h[1-6]$/.test(tag)) {
        flush()
        level = closing ? 0 : Number(tag[1])
      } else if (tag === 'br') {
        cur += ' '
      } else if (BLOCK_TAGS.has(tag)) {
        flush()
      }
    } else {
      cur += tok
    }
  }
  flush()
  return blocks
}

function pageBlocks(file) {
  const src = fs.readFileSync(file, 'utf8')
  const start = src.indexOf('return')
  return jsxBlocks(start >= 0 ? src.slice(start) : src)
}

function seoProps(file) {
  const src = fs.readFileSync(file, 'utf8')
  const m = src.match(/<Seo\b([\s\S]*?)\/>/)
  if (!m) return {}
  const attrs = m[1]
  const get = (k) => attrs.match(new RegExp(`${k}="([^"]*)"`))?.[1]
  return { title: get('title'), description: get('description'), path: get('path') }
}

function renderBlocks(blocks) {
  let seenH1 = false
  return blocks
    .map((b) => {
      if (b.level > 0) {
        let lvl = b.level
        if (lvl === 1) {
          if (seenH1) lvl = 2
          else seenH1 = true
        }
        return `        <h${lvl}>${esc(b.text)}</h${lvl}>`
      }
      return `        <p>${esc(b.text)}</p>`
    })
    .join('\n')
}

// ---------- shell templating (fleet pattern) ----------

function renderPage(shell, { title, description, canonical, inner }) {
  let html = shell
  const swap = (regex, replacement) => {
    if (regex.test(html)) html = html.replace(regex, replacement)
    else html = html.replace('</head>', `${replacement}\n</head>`)
  }
  swap(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
  swap(
    /<meta[^>]*name="description"[^>]*>/i,
    `<meta name="description" content="${esc(description)}" />`,
  )
  swap(/<link[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(canonical)}" />`)
  swap(/<meta[^>]*property="og:title"[^>]*>/i, `<meta property="og:title" content="${esc(title)}" />`)
  swap(
    /<meta[^>]*property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${esc(description)}" />`,
  )
  swap(/<meta[^>]*property="og:url"[^>]*>/i, `<meta property="og:url" content="${esc(canonical)}" />`)
  swap(/<meta[^>]*name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${esc(title)}" />`)
  swap(
    /<meta[^>]*name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  )
  if (/<div id="root">\s*<\/div>/.test(html)) {
    html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${inner}</div>`)
  } else {
    html = html.replace('<div id="root">', `<div id="root">${inner}`)
  }
  return html
}

let written = 0
function writeRoute(shell, route, meta) {
  const dir = route === '/' ? distRoot : path.join(distRoot, route)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), renderPage(shell, meta))
  written++
  console.log(`prerendered ${route}`)
}

// ---------- data ----------

const shell = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8')
const catalog = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'scripts', 'catalog.json'), 'utf8'),
)
const { blogArticles } = await loadModule(path.join(srcRoot, 'data', 'blogArticles.ts'))
const { categories } = await loadModule(path.join(srcRoot, 'data', 'categories.ts'))

const catName = (id) => categories.find((c) => c.id === id)?.name ?? id

const programCard = (p, heading = 3) => `        <article>
          <h${heading}><a href="/program/${esc(p.id)}">${esc(p.title)}</a></h${heading}>
          <p>${esc(p.description)}</p>
          <p>Category: <a href="/categories">${esc(catName(p.category))}</a>${p.tags?.length ? ` · Tags: ${esc(p.tags.join(', '))}` : ''}</p>
          <p><a href="/offer/${esc(p.id)}">Get offer</a> · <a href="/program/${esc(p.id)}">Program details</a></p>
        </article>`

const builders = {}

// Home — page copy from Home.tsx + featured categories + top programs.
{
  const file = path.join(srcRoot, 'pages', 'Home.tsx')
  const seo = seoProps(file)
  const blocks = pageBlocks(file)
  builders['/'] = () => ({
    title: seo.title ?? 'referrals.live — Turn Your Links Into Money',
    description:
      seo.description ??
      'referrals.live — discover, share, and monetize the best referral programs.',
    inner: `<main>
${renderBlocks(blocks)}
      <section>
        <h2>Browse by category</h2>
${categories
  .map(
    (c) => `        <article>
          <h3><a href="/categories">${esc(c.name)}</a></h3>
          <p>${esc(c.description)}</p>
        </article>`,
  )
  .join('\n')}
      </section>
      <section>
        <h2>Trending referral programs</h2>
${catalog.slice(0, 10).map((p) => programCard(p)).join('\n')}
        <p><a href="/browse">Browse all ${catalog.length} programs</a></p>
      </section>
    </main>`,
  })
}

// Browse — the listings page: every public program.
{
  const file = path.join(srcRoot, 'pages', 'Browse.tsx')
  const seo = seoProps(file)
  builders['/browse'] = () => ({
    title: seo.title ?? 'Browse referral programs — referrals.live',
    description: seo.description ?? 'Search and filter referral programs by category, popularity, and freshness.',
    inner: `<main>
      <h1>Browse referral programs</h1>
      <p>${catalog.length} public referral and affiliate programs — fintech, crypto, SaaS, AI tools, travel, and e-commerce. Open a program for details or get the offer.</p>
${catalog.map((p) => programCard(p, 2)).join('\n')}
    </main>`,
  })
}

// Categories — every category with its programs.
{
  const file = path.join(srcRoot, 'pages', 'Categories.tsx')
  const seo = seoProps(file)
  builders['/categories'] = () => ({
    title: seo.title ?? 'Referral categories — referrals.live',
    description: seo.description ?? 'Explore referral programs by vertical.',
    inner: `<main>
      <h1>Referral categories</h1>
${categories
  .map((c) => {
    const items = catalog.filter((p) => p.category === c.id)
    return `      <section>
        <h2>${esc(c.name)}</h2>
        <p>${esc(c.description)}</p>
        <p>${items.length} program${items.length === 1 ? '' : 's'}:</p>
${items
  .map(
    (p) => `        <article>
          <h3><a href="/program/${esc(p.id)}">${esc(p.title)}</a></h3>
          <p>${esc(p.description)}</p>
          <p><a href="/offer/${esc(p.id)}">Get offer</a></p>
        </article>`,
  )
  .join('\n')}
      </section>`
  })
  .join('\n')}
    </main>`,
  })
}

// Program detail pages — one per catalog entry.
for (const p of catalog) {
  builders[`/program/${p.id}`] = () => ({
    title: `${p.title} — referrals.live`,
    description: p.description,
    inner: `<main>
      <article>
        <p><a href="/browse">All programs</a> · <a href="/categories">${esc(catName(p.category))}</a></p>
        <h1>${esc(p.title)}</h1>
        <p>${esc(p.description)}</p>
        ${p.image ? `<p><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" /></p>` : ''}
        <p>Category: ${esc(catName(p.category))}${p.tags?.length ? ` · Tags: ${esc(p.tags.join(', '))}` : ''}</p>
        <p><a href="/offer/${esc(p.id)}">Get offer</a></p>
        <p><a href="/disclosure">Affiliate disclosure</a> · <a href="/browse">Browse more programs</a></p>
      </article>
    </main>`,
  })
}

// Blog index + articles.
builders['/blog'] = () => {
  const file = path.join(srcRoot, 'pages', 'Blog.tsx')
  const seo = seoProps(file)
  return {
    title: seo.title ?? 'Blog — referrals.live',
    description: seo.description ?? 'Guides and breakdowns on referral programs, affiliate marketing, and stacking bonuses.',
    inner: `<main>
      <h1>Blog</h1>
${blogArticles
  .map(
    (a) => `        <article>
          <h2><a href="/blog/${esc(a.slug)}">${esc(a.title)}</a></h2>
          <p>${esc(a.date)} · ${esc(a.readTime)}</p>
          <p>${esc(a.excerpt)}</p>
        </article>`,
  )
  .join('\n')}
    </main>`,
  }
}

for (const a of blogArticles) {
  builders[`/blog/${a.slug}`] = () => ({
    title: `${a.title} — referrals.live`,
    description: a.excerpt,
    inner: `<main>
      <article>
        <p>${esc(a.date)} · ${esc(a.readTime)} · <a href="/blog">Blog</a></p>
        <h1>${esc(a.title)}</h1>
        <p>${esc(a.excerpt)}</p>
${(a.sections ?? [])
  .map(
    (s) => `        <section>
          <h2>${esc(s.heading)}</h2>
${(s.body ?? []).map((para) => `          <p>${esc(para)}</p>`).join('\n')}
        </section>`,
  )
  .join('\n')}
${
  a.faq?.length
    ? `        <section>
          <h2>Frequently asked questions</h2>
${a.faq.map((f) => `          <h3>${esc(f.q)}</h3>\n          <p>${esc(f.a)}</p>`).join('\n')}
        </section>`
    : ''
}
${
  a.embeds?.length
    ? `        <section>
          <h2>Keep exploring</h2>
${a.embeds.map((e) => `          <p><a href="${esc(e.href)}">${esc(e.label)}</a></p>`).join('\n')}
        </section>`
    : ''
}
      </article>
    </main>`,
  })
}

// Leaderboard — the app ranks programs by community votes/clicks.
{
  const file = path.join(srcRoot, 'pages', 'Leaderboard.tsx')
  const seo = seoProps(file)
  const blocks = pageBlocks(file)
  const ranked = [...catalog].sort((x, y) => y.votes - x.votes || y.clicks - x.clicks)
  builders['/leaderboard'] = () => ({
    title: seo.title ?? 'Leaderboard — referrals.live',
    description: seo.description ?? 'The top referral programs ranked by community votes and clicks.',
    inner: `<main>
${renderBlocks(blocks)}
      <section>
        <h2>Top programs</h2>
${ranked
  .slice(0, 20)
  .map(
    (p, i) => `        <article>
          <h3>${i + 1}. <a href="/program/${esc(p.id)}">${esc(p.title)}</a></h3>
          <p>${esc(p.description)}</p>
          <p>${esc(p.votes)} votes · ${esc(p.clicks)} clicks · <a href="/offer/${esc(p.id)}">Get offer</a></p>
        </article>`,
  )
  .join('\n')}
      </section>
    </main>`,
  })
}

// Testimonials — the app loads stories from the API, so the generic
// source-extraction builder scoops JSX expression fragments (ternaries,
// interpolations) into the snapshot. Give the route a dedicated builder
// with the page's real static copy instead. No stories are invented here:
// the live app loads the latest community stories automatically.
builders['/testimonials'] = () => ({
  title: 'Success Stories — referrals.live',
  description: 'Creator testimonials sharing how they earn money from referral programs.',
  inner: `<main>
      <p>Success Stories</p>
      <h1>Creator Testimonials</h1>
      <p>Read how our top creators monetize referrals and build profitable affiliate businesses.</p>
      <section>
        <h2>Stories from the community</h2>
        <p>Every story on this page is shared by a creator in the referrals.live community. Each one names the referral program they promoted, tells how they promoted it, and — when the creator chooses to share it — the earnings from that program and the period those earnings cover.</p>
        <p>The live page loads the newest published stories automatically. If no story has been published yet for a category you care about, browse the programs and the leaderboard to see what the community is promoting right now.</p>
      </section>
      <section>
        <h2>Share your success story</h2>
        <p>Building an income stream with a referral program listed here? Your story helps the next creator pick the right program and promote it well. Published stories carry your creator name, the program, and your results — exactly as you report them.</p>
        <p><a href="/browse">Browse referral programs</a> · <a href="/leaderboard">See the leaderboard</a> · <a href="/about">About referrals.live</a></p>
      </section>
    </main>`,
})

// Static pages whose copy lives in their page component (with <Seo> meta).
const STATIC_PAGES = {
  '/about': 'About.tsx',
  '/contact': 'Contact.tsx',
  '/privacy': 'Privacy.tsx',
  '/terms': 'Terms.tsx',
  '/disclosure': 'Disclosure.tsx',
  '/disclaimer': 'Disclaimer.tsx',
  '/premium': 'Premium.tsx',
  '/submit': 'Submit.tsx',
  '/analytics': 'Analytics.tsx',
}

for (const [route, file] of Object.entries(STATIC_PAGES)) {
  builders[route] = () => {
    const full = path.join(srcRoot, 'pages', file)
    const seo = seoProps(full)
    const blocks = pageBlocks(full)
    const hasH1 = blocks.some((b) => b.level === 1)
    return {
      title: seo.title ?? 'referrals.live — Turn Your Links Into Money',
      description: seo.description ?? 'referrals.live — discover, share, and monetize the best referral programs.',
      inner: `<main>
${hasH1 ? '' : `      <h1>${esc((seo.title ?? route.slice(1)).replace(/ — referrals\.live$/, ''))}</h1>\n`}${renderBlocks(blocks)}
    </main>`,
    }
  }
}

// ---------- run: every sitemap route + program pages ----------

const sitemap = fs.readFileSync(path.join(distRoot, 'sitemap.xml'), 'utf8')
const routes = [...sitemap.matchAll(/<loc>https:\/\/referrals\.live(\/[^<]*)<\/loc>/g)].map((m) =>
  m[1] === '' ? '/' : m[1].replace(/\/$/, '') || '/',
)
for (const p of catalog) routes.push(`/program/${p.id}`)

const missing = []
for (const route of [...new Set(routes)]) {
  const build = builders[route]
  if (!build) {
    missing.push(route)
    continue
  }
  const { title, description, inner } = build()
  writeRoute(shell, route, {
    title,
    description,
    canonical: `${SITE_URL}${route === '/' ? '/' : route}`,
    inner,
  })
}
if (missing.length) console.warn(`WARNING: no builder for routes: ${missing.join(', ')}`)
console.log(`prerender complete: ${written} routes`)
