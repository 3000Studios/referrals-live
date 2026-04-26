

export const GlobalFooter = () => {
  return (
    <footer className="w-full bg-black border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg tracking-tighter">3000Studios</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Universal Technical Partner and Lead Architect for the next generation of 
              AI-driven revenue engines. Built for speed, scaled for profit.
            </p>
          </div>
          
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Ecosystem</h4>
            <ul className="space-y-2">
              <li><a href="https://referrals.live" className="text-slate-400 text-xs hover:text-white transition-colors">Referrals Live</a></li>
              <li><a href="https://voicetowebsite.com" className="text-slate-400 text-xs hover:text-white transition-colors">VoiceToWebsite</a></li>
              <li><a href="https://findmerates.com" className="text-slate-400 text-xs hover:text-white transition-colors">FindMeRates</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-slate-400 text-xs hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-slate-400 text-xs hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/disclosure" className="text-slate-400 text-xs hover:text-white transition-colors">Affiliate Disclosure</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">AdSense Partner</h4>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] text-slate-500 font-mono">
              PUB-ID: ca-pub-5800977493749262
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} 3000Studios. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
             <span className="text-[10px] text-blue-500 font-bold uppercase">Build 2026.04.26</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
