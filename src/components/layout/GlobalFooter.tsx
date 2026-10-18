import { Link } from 'react-router-dom';
import { TrustTicker } from '../TrustTicker';

export const GlobalFooter = () => {
  return (
    <footer className="relative w-full overflow-hidden bg-[#020305] border-t border-white/5">
      {/* Top glow line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/25 to-transparent" />
      {/* Background depth radial */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_100%,rgba(255,215,0,0.04),transparent)]" />

      <TrustTicker />

      <div className="relative max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

          {/* Brand column */}
          <div className="space-y-5">
            <div className="font-display text-xl font-extrabold tracking-tight">
              <span className="text-white">referrals</span>
              <span className="text-gradient-neon">.live</span>
            </div>
            <p className="text-[13px] text-muted leading-relaxed max-w-xs">
              Referral deals that pay both sides: click a deal, sign up, you get the bonus and the
              poster earns a credit. Free to browse — Pro to post your own links.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span className="text-neon/70">Live on Cloudflare</span>
            </div>
          </div>

          {/* Marketplace links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 mb-5">Marketplace</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/browse" className="text-[13px] text-muted hover:text-white transition-colors duration-200 hover:[text-shadow:0_0_12px_rgba(0,255,136,0.4)]">
                  Browse referrals
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-[13px] text-muted hover:text-white transition-colors duration-200 hover:[text-shadow:0_0_12px_rgba(0,255,136,0.4)]">
                  Submit a program
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-[13px] text-muted hover:text-white transition-colors duration-200 hover:[text-shadow:0_0_12px_rgba(0,255,136,0.4)]">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/premium" className="text-[13px] text-muted hover:text-neon transition-colors duration-200">
                  Upgrade to Pro
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="text-[13px] text-muted hover:text-white transition-colors duration-200 hover:[text-shadow:0_0_12px_rgba(0,255,136,0.4)]">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-[13px] text-muted hover:text-white transition-colors duration-200 hover:[text-shadow:0_0_12px_rgba(0,255,136,0.4)]">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 mb-5">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-[13px] text-muted hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[13px] text-muted hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclosure" className="text-[13px] text-muted hover:text-white transition-colors duration-200">
                  Affiliate Disclosure
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-[13px] text-muted hover:text-white transition-colors duration-200">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* FTC affiliate disclosure — kept prominent on every page */}
        <p className="mt-14 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-[11px] leading-relaxed text-white/45">
          Affiliate disclosure: referrals.live, the site owner, and members who post here may earn a
          commission or referral credit when you sign up through links on this site — at no extra
          cost to you. Some links are the owner's own referral links and are labeled as such.{" "}
          <Link to="/disclosure" className="underline hover:text-gold">Read the full disclosure</Link>.
        </p>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.22em]">
            © {new Date().getFullYear()} referrals.live — All sales final where permitted by law.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-[10px] text-white/25 uppercase tracking-[0.2em] hover:text-white/50 transition-colors">
              Blog
            </Link>
            <Link to="/about" className="text-[10px] text-white/25 uppercase tracking-[0.2em] hover:text-white/50 transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-[10px] text-white/25 uppercase tracking-[0.2em] hover:text-white/50 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
