import { Seo } from "@/components/seo/Seo";

export function About() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo
        title="About — referrals.live"
        description="Referrals.live is an independent directory and resource site for the referral economy."
        path="/about"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">About Referrals.live</h1>
      <p className="text-muted">
        Referrals.live is an independent directory and resource site for the referral economy — referral links, affiliate
        partnerships, creator codes, and word-of-mouth rewards.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">What this site does</h2>
      <p className="text-muted">
        First, it maintains a directory of referral programs — what they pay, how tracking works, and what the terms say.
      </p>
      <p className="text-muted">
        Second, it publishes practical guides on payout mechanics, disclosure, vetting programs, taxes, and promoting without
        burning relationships — written by people who've done the work.
      </p>
      <p className="text-muted">
        Third, it ranks and reviews offers honestly — plain about the pros, the cons, who each one suits, and where the catches
        are.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">What this site is not</h2>
      <p className="text-muted">
        This is not a get-rich-quick scheme: no income promises, no earnings screenshots. It is not financial or legal advice.
        And it is not owned by any of the programs listed here.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">How the site makes money</h2>
      <p className="text-muted">
        Referrals.live earns a commission when visitors sign up or purchase through referral links on the site. That costs you
        nothing extra — and programs don't pay for editorial placement.
      </p>
    </div>
  );
}
