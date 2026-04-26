import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const ReferralLinkCard = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const referralUrl = `${window.location.origin}/api/referral?code=${code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500
      ${copied
        ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
        : 'border-white/10 bg-white/5 dark:border-slate-800 dark:bg-slate-900 shadow-sm'}
    `}>
      <p className="text-sm font-medium text-slate-400 mb-4">
        Your Unique Referral Link
      </p>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
        <code className="flex-1 text-sm font-mono truncate text-white/80">
          {referralUrl}
        </code>

        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:scale-105 active:scale-95 transition-all text-white"
        >
          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
        </button>
      </div>

      <p className="text-xs mt-3 text-muted">
        Share this link to earn 20% commission on every successful signup.
      </p>

      <button
        onClick={() => {
          const text = `Join the best referral marketplace and start earning today! 🚀\n\nSign up here: ${referralUrl}\n\n#AffiliateMarketing #SideHustle`;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
        }}
        className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white hover:border-neon/40 transition-all"
      >
        Share on X
      </button>
    </div>
  );
};
