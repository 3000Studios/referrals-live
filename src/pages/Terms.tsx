import React from 'react';

export default function Terms() {
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
            <p className="font-bold text-white">ALL SALES ARE FINAL. NO REFUNDS UNDER ANY CIRCUMSTANCES. This includes premium placements, subscriptions, and any other paid services within the ecosystem.</p>
          </section>

          <section className="p-8 bg-gold/5 border border-gold/20 rounded-3xl">
            <h2 className="text-2xl font-bold text-gold mb-4">3. TOTAL LIABILITY WAIVER</h2>
            <p className="font-bold italic text-white">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, REFERRALS-LIVE AND ITS OPERATORS ARE NOT LIABLE FOR ANY DAMAGES, LOSSES, LEGAL DISPUTES, OR FINANCIAL TROUBLE ARISING FROM THE USE OF THIS SERVICE. USER ASSUMES ALL RISK. WE CANNOT BE HELD LIABLE FOR ANYTHING.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
            <p>Spamming, fraudulent submissions, or interference with the platform logic will result in immediate and permanent account termination without appeal.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
