import { Link } from 'react-router-dom';
import { TrustTicker } from '../TrustTicker';

export const GlobalFooter = () => {
  return (
    <footer className="w-full overflow-hidden bg-black border-t border-white/10">
      <TrustTicker />
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-neon/70 to-transparent" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg tracking-tighter">referrals.live</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              A live referral marketplace for creators, operators, and side hustlers who want tracked links, public rankings, and premium placement.
            </p>
          </div>
          
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Marketplace</h4>
            <ul className="space-y-2">
              <li><Link to="/browse" className="text-slate-400 text-xs hover:text-white transition-colors">Browse referrals</Link></li>
              <li><Link to="/submit" className="text-slate-400 text-xs hover:text-white transition-colors">Submit a program</Link></li>
              <li><Link to="/premium" className="text-slate-400 text-xs hover:text-white transition-colors">Upgrade to Pro</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-slate-400 text-xs hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-slate-400 text-xs hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/disclosure" className="text-slate-400 text-xs hover:text-white transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} referrals.live. All sales final where permitted by law.
          </p>
          <div className="flex items-center gap-6">
             <span className="text-[10px] text-blue-500 font-bold uppercase">Live on Cloudflare</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
