import { Seo } from "@/components/seo/Seo";

export function Terms() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo title="Terms of Service — referrals.live" description="Terms of Service for referrals.live." path="/terms" />
      <h1 className="font-display text-4xl font-extrabold text-white">Terms of Service</h1>
      <p className="text-sm text-muted">Last updated: April 16, 2026</p>
      <p className="text-muted">
        By using referrals.live you agree not to misuse the platform, not to post unlawful content, and to comply with applicable
        advertising and financial promotion rules in your jurisdiction.
      </p>
      <p className="text-muted">
        Listings and blog content are informational. Offers change frequently; users must verify terms with the underlying provider.
      </p>
    </div>
  );
}
