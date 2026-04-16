import { Seo } from "@/components/seo/Seo";

export function About() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo
        title="About — referrals.live"
        description="referrals.live is a referral marketplace focused on transparency, community ranking, and monetization-ready publishing."
        path="/about"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">About referrals.live</h1>
      <p className="text-muted">
        referrals.live exists to help people find high-signal referral programs without wading through noisy forums. We combine
        marketplace discovery with educational SEO content so visitors can make informed decisions.
      </p>
      <p className="text-muted">
        The platform is built for creators and operators who care about compliance: clear disclosures, structured listings, and
        analytics hooks that make measurement straightforward as you scale.
      </p>
      <p className="text-muted">
        This deployment is optimized for Cloudflare Pages: fast static delivery, edge caching, and straightforward CI with Wrangler.
      </p>
    </div>
  );
}
