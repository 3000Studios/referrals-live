DEPLOYMENT RULES
- Deploy `referrals.live` only with Cloudflare Wrangler.
- Do not use Netlify for this repo.
- Do not use GitHub Actions for deployment.
- Keep one Cloudflare Pages project or Worker per domain.
- Keep one repo, one domain, and one active branch for each domain.
- Production deploy command: `npm run deploy`.
- Verify production on `https://referrals.live` after every deploy before reporting completion.
