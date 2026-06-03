export const GlobalNav = () => {
  return (
    <div className="w-full border-b border-white/5 bg-[#020305]/95 backdrop-blur-xl sticky top-0 z-[110]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className="text-[9px] font-bold tracking-[0.35em] uppercase text-gradient-neon">
            referrals.live
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-white/25 md:inline">
            Live referral marketplace
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon shadow-[0_0_8px_rgba(0,255,136,0.7)]" />
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
            System live
          </span>
        </div>
      </div>
    </div>
  );
};
