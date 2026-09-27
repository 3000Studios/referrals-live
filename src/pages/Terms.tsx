export function Terms() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="glass-card p-12 max-w-4xl mx-auto">
        <span className="eyebrow text-gold">Legal Framework</span>
        <h1 className="text-4xl font-black mb-4">Terms of Use</h1>
        <p className="text-sm text-secondary mb-8">Last updated: September 27, 2026</p>

        <div className="space-y-12 text-secondary">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">General information only</h2>
            <p>
              Everything on referrals.live is general information only. It is not legal, tax, or financial advice, and reading
              it doesn&apos;t create any professional relationship. If you need advice about your situation, talk to a qualified
              professional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">No earnings promises</h2>
            <p>
              We make no promises about earnings. Results depend on your effort and on factors outside anyone&apos;s control —
              your audience, the programs&apos; terms, and plain timing. Treat every figure on this site as illustrative, not a
              guarantee.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Program details change</h2>
            <p>
              Referral program details — payouts, eligibility, cookie windows, terms — change frequently. Always verify the
              current terms on the official program site before acting. If you spot something outdated here, tell us through the
              Contact page; corrections to live recommendations are our top priority.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-party links</h2>
            <p>
              Referral and affiliate links on this site go to third-party websites, which operate under their own terms and
              privacy policies. See our <a href="/disclosure" className="text-gold underline">Disclosure</a> page for how
              referrals.live earns from those links.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
