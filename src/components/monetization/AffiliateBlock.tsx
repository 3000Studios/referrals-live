import { AdSlot } from "@/components/monetization/AdSlot";

export function AffiliateBlock() {
  return (
    <div className="my-10 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Affiliate spotlight</div>
      <AdSlot variant="in-feed" />
      <p className="text-xs text-muted">
        Some links on referrals.live may be affiliate or referral links. We may earn commissions at no extra cost to you.
      </p>
    </div>
  );
}
