# referrals.live

Production-grade referral marketplace UI: Vite + React + TypeScript, Tailwind, Framer Motion, GSAP, Three.js (R3F), Zustand, and Cloudflare Pages deployment via Wrangler.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## AdSense

1. The site loads the AdSense script globally from `index.html` using publisher ID `ca-pub-5800977493749262`.
2. `public/ads.txt` is included at `/ads.txt` for crawler verification.
3. Create ad units in AdSense, then set these **Cloudflare Pages** environment variables (or `.env.local` for dev):

- `VITE_ADSENSE_SLOT_BANNER`
- `VITE_ADSENSE_SLOT_RECT`
- `VITE_ADSENSE_SLOT_MOBILE`
- `VITE_ADSENSE_SLOT_FEED`

Until slots are set, ad regions render a labeled placeholder that explains how to activate live ads (keeps layout honest and reviewer-friendly).

## Stock imagery APIs (optional)

- `VITE_UNSPLASH_ACCESS_KEY`
- `VITE_PEXELS_API_KEY`

If omitted, the app uses curated Unsplash URLs bundled in seed content.

## SEO

- Per-route meta + Open Graph tags via `react-helmet-async` (`src/components/seo/Seo.tsx`)
- `public/robots.txt` and `public/sitemap.xml`
- JSON-LD for Organization, WebSite, and blog articles

Canonical site URL defaults to `https://referrals.live` (`src/lib/seo.ts`) — override with `VITE_SITE_URL` if needed.

## GitHub Actions (recommended deploy path)

On every push to `main`, `.github/workflows/cloudflare-pages.yml` builds and deploys to Cloudflare Pages.

Add these **repository secrets** in GitHub → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — API token with **Account → Cloudflare Pages → Edit** (and **Account Settings → Read** if prompted).
- `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard sidebar (Account ID).

The workflow runs `wrangler pages deploy dist --project-name=referrals-live`. The Pages project **`referrals-live`** is created in Cloudflare; production URL will be **`https://referrals-live.pages.dev`** after the first successful deployment.

If the Cloudflare API returns **429 / rate limit** locally, wait several minutes and rerun `npm run deploy`, or rely on the GitHub Action (often less bursty than repeated CLI calls).

## Deploy to Cloudflare Pages (Wrangler)

Prereqs: Node 20+, Wrangler v3 (`npm i -g wrangler` or use `npx`).

```bash
npm run build
wrangler login
wrangler pages project create referrals-live
wrangler pages deploy dist --project-name=referrals-live
```

Or use the npm script:

```bash
npm run deploy
```

### Direct deploy (when `wrangler pages deploy` hits HTTP 429 on project lookup)

`npm run deploy:direct` runs `scripts/cf-pages-deploy.mjs`: it uses the Pages **upload JWT** for assets, then your **Wrangler OAuth** (after `wrangler login`) or **`CLOUDFLARE_API_TOKEN`** for the final deployment POST. This avoids the `GET .../pages/projects/...` call that often rate-limits.

```bash
npm run build
# Obtain JWT: GET .../accounts/{account_id}/pages/projects/referrals-live/upload-token (or use Cloudflare MCP / API)
$env:PAGES_UPLOAD_JWT="<paste jwt>"
npm run deploy:direct
```

### Live status (this environment)

- **Pages**: Production deploy succeeded; the project serves from **`https://referrals-live.pages.dev`** (deployment aliases rotate per deploy).
- **DNS**: Apex **`referrals.live`** should be a **proxied CNAME** to **`referrals-live.pages.dev`** (replace any parking/A records). **`www`** can CNAME to the same target.
- **Custom domain in Pages**: Add **`referrals.live`** under Pages → **Custom domains** if it is not already **Active**. If the API returns **429**, finish in the dashboard or retry later.

### Custom domain (`referrals.live`)

1. In Cloudflare DNS for the domain, add a Pages hostname binding to the `referrals-live` project.
2. Ensure the hostname is **proxied** (orange cloud) and SSL mode is **Full (strict)** once origin certificates are valid.

## Scaling beyond the static demo

- **Backend**: replace Zustand persistence with an API for listings, votes, and auth.
- **Search**: move instant search to Algolia/Typesense/Elastic for large catalogs.
- **Moderation**: add reporting + admin review before listings go public.
- **Payments**: connect Stripe/Lemon for Premium/Boost SKUs wired in `Premium` and `Dashboard`.

## Repository bootstrap

```bash
git init
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/referrals-live.git
git add .
git commit -m "Initial full build of referrals.live"
git push -u origin main
```

## License

Proprietary — update as needed for your organization.
