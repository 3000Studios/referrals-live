# Referrals.Live — Agent Instructions

## Overview
- **Domain:** referrals.live
- **Stack:** React 18 + Vite 6 + TypeScript + Tailwind CSS 3 + Three.js + Zustand
- **Deploy:** Cloudflare Pages + Workers (D1, Durable Objects)
- **Package Manager:** npm
- **Branch:** `master` (NOT `main`)

## Key Commands
```bash
npm install
npm run dev              # Vite dev server
npm run build            # typecheck + vite build
npm run preview          # vite preview
npm run lint             # typecheck (tsc --noEmit on both tsconfig files)
npm run typecheck        # tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.functions.json
npm run deploy           # build + wrangler pages deploy + deploy ingest worker
npm run deploy:direct    # build + cf-pages-deploy.mjs script
npm run deploy:ingest    # wrangler deploy --config wrangler.ingest.toml
```

## Structure
- `src/` — React frontend source
- `functions/` — Cloudflare Pages Functions
- `workers/` — Standalone Workers (ingest worker with cron)
- `migrations/` — D1 database migrations
- `scripts/` — Deploy/build helpers
- `public/` — Static assets

## Bindings
- **D1:** `DB` — referrals-live
- **Durable Objects:** `CHAT` — ChatRoom class (in ingest worker)
- **Ingest Worker:** hourly cron (`0 * * * *`) via wrangler.ingest.toml

## Constraints
- Deploy through Cloudflare only — project name: `referrals-live`
- **Uses `master` branch** — all deploys, PRs, and merges target `master`
- Secrets from global.env, never hardcode
- Two TypeScript configs: `tsconfig.json` (frontend) + `tsconfig.functions.json` (CF Functions) — both must pass typecheck
- Has premium tiers and affiliate referral system — test payment flows carefully
- Ingest worker deploys separately via `wrangler.ingest.toml`
- Verify production at https://referrals.live after every deploy
