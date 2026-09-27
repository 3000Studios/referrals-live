import { Seo } from "@/components/seo/Seo";

export function Disclosure() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo
        title="Affiliate Disclosure — referrals.live"
        description="Affiliate disclosure for referrals.live — how referral links, paid placements, and display ads work."
        path="/disclosure"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">Affiliate Disclosure</h1>
      <p className="text-muted">
        Many of the links on referrals.live are referral or affiliate links. When you sign up or buy through them, the
        company pays us a commission — a flat amount, a percentage of the sale, or recurring revenue share. It costs you
        nothing extra.
      </p>
      <p className="text-muted">
        Commissions don&apos;t change our recommendations. We only recommend products and programs we&apos;d suggest to a friend
        if there were no commission at all. Every commercial link is disclosed where it appears, in line with the FTC&apos;s
        Endorsement Guides.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Paid placements</h2>
      <p className="text-muted">
        Some directory placements are paid. They are always labeled &quot;Sponsored&quot; or &quot;Featured placement&quot;, they
        never affect our editorial reviews or rankings, and programs have to pass our vetting before they can buy one.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Display ads</h2>
      <p className="text-muted">
        You&apos;ll also see display ads served by Google AdSense. The ad content is chosen by Google, not by us, and an ad
        appearing here isn&apos;t an endorsement.
      </p>
    </div>
  );
}
