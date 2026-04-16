import { Seo } from "@/components/seo/Seo";

export function Privacy() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo title="Privacy Policy — referrals.live" description="Privacy Policy for referrals.live." path="/privacy" />
      <h1 className="font-display text-4xl font-extrabold text-white">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: April 16, 2026</p>
      <h2 className="font-display text-2xl font-bold text-white">What we collect</h2>
      <p className="text-muted">
        This demo may store information locally in your browser (for example: account details you enter, referral submissions, and
        email addresses you provide to signup forms). When you connect a backend, define your own data processing agreement.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Analytics</h2>
      <p className="text-muted">
        The site includes integration points for analytics and advertising. Third-party services (such as Google AdSense) may collect
        information pursuant to their own policies.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Contact</h2>
      <p className="text-muted">Questions: use the Contact page.</p>
    </div>
  );
}
