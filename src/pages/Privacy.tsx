import { Seo } from "@/components/seo/Seo";

export function Privacy() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo title="Privacy Policy — referrals.live" description="Privacy Policy for referrals.live." path="/privacy" />
      <h1 className="font-display text-4xl font-extrabold text-white">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: April 16, 2026</p>
      <h2 className="font-display text-2xl font-bold text-white">What we collect</h2>
      <p className="text-muted">
        We collect account details you submit, referral listings, email capture form submissions, session cookies, billing status,
        and marketplace activity such as votes and tracked outbound clicks.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Analytics</h2>
      <p className="text-muted">
        The site uses analytics and advertising integrations. Third-party services such as Google AdSense may collect
        information pursuant to their own policies.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Contact</h2>
      <p className="text-muted">Questions: use the Contact page.</p>
    </div>
  );
}
