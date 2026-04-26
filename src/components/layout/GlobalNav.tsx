

const properties = [
  { name: 'Referrals Live', url: 'https://referrals.live' },
  { name: 'VoiceToWebsite', url: 'https://voicetowebsite.com' },
  { name: 'FindMeRates', url: 'https://findmerates.com' },
  { name: 'Calistique', url: 'https://calistique.com' },
  { name: 'MyAppAI', url: 'https://myappai.net' },
];

export const GlobalNav = () => {
  return (
    <nav className="w-full bg-black/90 border-b border-white/10 backdrop-blur-md sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-bold tracking-[0.3em] text-blue-500 uppercase">
            3000Studios Network
          </span>
          <div className="hidden md:flex items-center gap-4">
            {properties.map((prop) => (
              <a
                key={prop.name}
                href={prop.url}
                className="text-[11px] text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
              >
                {prop.name}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">System Live</span>
        </div>
      </div>
    </nav>
  );
};
