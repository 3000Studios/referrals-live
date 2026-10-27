import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

export function Terms() {
  return (
    <div className="max-w-3xl">
      <Seo
        title="Terms of Use — referrals.live"
        description="Terms of Use for referrals.live — general information only, no earnings promises, and how third-party referral programs set their own terms."
        path="/terms"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Legal</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-white">Terms of Use</h1>
      <p className="mt-3 text-sm text-muted">Last updated: September 27, 2026</p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="font-display text-2xl font-bold text-white">General information only</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Everything on referrals.live is general information only. It is not legal, tax, or financial advice, and reading
            it doesn&apos;t create any professional relationship. If you need advice about your situation, talk to a qualified
            professional.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">No earnings promises</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We make no promises about earnings. Results depend on your effort and on factors outside anyone&apos;s control —
            your audience, the programs&apos; terms, and plain timing. Treat every figure on this site as illustrative, not a
            guarantee.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">Program details change</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Referral program details — payouts, eligibility, cookie windows, terms — change frequently. Always verify the
            current terms on the official program site before acting. If you spot something outdated here, tell us through the{" "}
            <Link to="/contact" className="text-gold hover:underline">Contact page</Link>; corrections to live recommendations
            are our top priority.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">Third-party links</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Referral and affiliate links on this site go to third-party websites, which operate under their own terms and
            privacy policies. See our <Link to="/disclosure" className="text-gold hover:underline">Disclosure</Link> page for
            how referrals.live earns from those links.
          </p>
        </section>
      </div>
    </div>
  );
}
