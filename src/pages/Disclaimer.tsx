import { Seo } from "@/components/seo/Seo";

export function Disclaimer() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo
        title="Disclaimer — referrals.live"
        description="Financial, affiliate, and general disclaimers for referrals.live."
        path="/disclaimer"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">Disclaimer</h1>
      <p className="text-muted">
        Nothing on referrals.live is financial, legal, or tax advice. Referral and affiliate offers carry risk; results vary.
        Always read the provider’s current terms before applying or investing.
      </p>
      <p className="text-muted">
        This page is separate from our affiliate and advertising disclosure. For disclosure details, visit{" "}
        <a href="/disclosure">/disclosure</a>.
      </p>
    </div>
  );
}
