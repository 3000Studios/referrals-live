import { Seo } from "@/components/seo/Seo";

export function Disclosure() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo
        title="Disclosure — referrals.live"
        description="Affiliate and advertising disclosure for referrals.live."
        path="/disclosure"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">Disclosure</h1>
      <p className="text-muted">
        Some links on referrals.live may be referral or affiliate links. If you click and take an action (such as signing up
        or purchasing), referrals.live may earn a commission at no additional cost to you.
      </p>
      <p className="text-muted">
        We aim to recommend products and programs that match the audience and provide real value. Offers, payouts, and terms
        can change at any time—always review the provider’s official terms before applying.
      </p>
      <p className="text-muted">
        Advertising placements (including AdSense) are served by third parties and may use cookies or similar technologies to
        personalize ads where allowed by law.
      </p>
    </div>
  );
}
