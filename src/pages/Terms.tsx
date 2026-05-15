export function Terms() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="glass-card p-12 max-w-4xl mx-auto">
        <span className="eyebrow text-gold">Legal Framework</span>
        <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
        
        <div className="space-y-12 text-secondary">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Use of Service</h2>
            <p>Referrals-live provides a platform for discovering and submitting referral programs. We do not guarantee the accuracy or availability of any third-party offers.</p>
          </section>

          <section className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl">
            <h2 className="text-2xl font-bold text-red-500 mb-4">2. NO REFUND POLICY</h2>
            <p className="font-bold text-white">All sales are final and non-refundable except where a refund is required by applicable law. This includes premium placements, subscriptions, and any other paid services inside referrals.live.</p>
          </section>

          <section className="p-8 bg-gold/5 border border-gold/20 rounded-3xl">
            <h2 className="text-2xl font-bold text-gold mb-4">3. Limitation of Liability</h2>
            <p className="font-bold italic text-white">To the maximum extent permitted by applicable law, referrals.live and its operators are not liable for indirect, incidental, consequential, special, punitive, or lost-profit damages arising from use of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
            <p>Spamming, fraudulent submissions, or interference with the platform logic will result in immediate and permanent account termination without appeal.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Referral and Affiliate Content</h2>
            <p>Users are responsible for the accuracy, legality, and compliance of referral links they submit. We may remove, edit, or reject listings that appear misleading, unsafe, unlawful, or inconsistent with marketplace quality standards.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. No Earnings Guarantee</h2>
            <p>We do not guarantee earnings, traffic, ranking position, referral approvals, account acceptance by third-party programs, or any particular business outcome.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
