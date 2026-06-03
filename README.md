# referrals.live

Production-grade referral marketplace UI: Vite + React + TypeScript, Tailwind, Framer Motion, GSAP, Three.js (R3F), Zustand, and Cloudflare Pages deployment via Cloudflare Wrangler.

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

## Payments (Premium upgrade)

Two ways to accept money for the $7.99/mo Premium plan — use either or both:

1. **Tracked Stripe Checkout (recommended).** Set these in **Cloudflare Pages** env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (the recurring price), and `STRIPE_WEBHOOK_SECRET` (point the webhook at `/api/billing/webhook`). Logged-in users get a Checkout session that records the subscription and credits the referring affiliate.
2. **Zero-backend fallback.** If you haven't wired the API keys yet, create a **Stripe Payment Link** and/or a **PayPal** link and set `VITE_STRIPE_PAYMENT_LINK` / `VITE_PAYPAL_LINK`. The "Pay with Card" / "Pay with PayPal" buttons then work immediately for everyone (no login or webhook required).

The Premium page tries the tracked checkout first for logged-in users and automatically falls back to the payment link if the backend isn't configured.

## Stock imagery APIs (optional)

- `VITE_UNSPLASH_ACCESS_KEY`
- `VITE_PEXELS_API_KEY`

If omitted, the app uses curated Unsplash URLs bundled in seed content.

## SEO

- Per-route meta + Open Graph tags via `react-helmet-async` (`src/components/seo/Seo.tsx`)
- `public/robots.txt` and `public/sitemap.xml`
- JSON-LD for Organization, WebSite, and blog articles

Canonical site URL defaults to `https://referrals.live` (`src/lib/seo.ts`) — override with `VITE_SITE_URL` if needed.

## Deploy to Cloudflare Pages (Wrangler)

This repo deploys only through Cloudflare Wrangler. Do not use Netlify or GitHub Actions for deployment. Keep one Pages project or Worker per domain, one repo, one domain, and one active branch for each domain.

Prereqs: Node 20+ and Wrangler (`npm install` installs the pinned project dependency).

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

### Direct Wrangler API deploy fallback

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
git add .
git commit -m "Initial full build of referrals.live"
```

## License

Proprietary — update as needed for your organization.
