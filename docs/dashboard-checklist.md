# Dashboard Checklist for referrals.live / referrals-live

## Cloudflare
- SSL/TLS: Full Strict where supported.
- HTTPS: ON.
- HSTS: max-age 15552000 if safe.
- Brotli: ON.
- HTTP/2 and HTTP/3: ON.
- Early Hints: ON if safe.
- Rocket Loader: OFF if it breaks Firebase, ads, analytics, or login.
- Verified crawlers: do not challenge.
- Private routes: noindex and no-store.
- Static assets: long cache.
- Auth/API/payment/private: never cache.

## Firebase
- Auth providers: verify Email/Password, Google, GitHub only where needed.
- Authorized domains: include referrals.live and www.referrals.live if used.
- Firestore: use app-scoped rules under apps/referrals-live.
- Storage: do not initialize unless billing/storage is separately approved.

## Google
- Submit https://referrals.live/sitemap.xml in Search Console.
- Confirm /robots.txt and /ads.txt are live.
- Confirm About, Contact, Privacy, Terms are public and linked.
- Confirm GA4/GTM installed once only.
- Do not submit AdSense review until all public requirements are ready.
