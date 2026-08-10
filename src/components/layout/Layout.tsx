import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { NetworkBackground } from "@/components/three/NetworkBackground";
import { PageWallpaper } from "@/components/three/PageWallpaper";
import { WallpaperBase } from "@/components/three/WallpaperBase";
import { MouseTrail } from "@/components/effects/MouseTrail";
import { Ticker } from "@/components/layout/Ticker";
import { AdSlot } from "@/components/monetization/AdSlot";
import { PageLoader } from "@/components/layout/PageLoader";
import { useAppStore } from "@/store/useAppStore";
import { ConsentBanner } from "@/components/legal/ConsentBanner";

export function Layout() {
  const location = useLocation();
  const hydrate = useAppStore((s) => s.hydrate);
  const refreshPublic = useAppStore((s) => s.refreshPublic);
  const [showTrail, setShowTrail] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setShowTrail(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    hydrate().catch(() => null);
  }, [hydrate]);

  useEffect(() => {
    const refresh = () => refreshPublic().catch(() => null);
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [refreshPublic]);

  return (
    <div className="relative min-h-screen bg-void">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:border focus:border-neon/40 focus:bg-void focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* UI Layer */}
      <div className="relative z-10 pb-[100px] md:pb-[300px]">
        <GlobalNav />
        <Navbar />
        <Ticker />
        <div className="pt-6">
          <div className="mx-auto max-w-7xl px-4 pb-8">
            <div className="hidden lg:block">
              <AdSlot variant="banner" />
            </div>
          </div>

          <motion.main
            id="main-content"
            initial={{ opacity: 0, y: 32, rotateX: -6 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-7xl px-4 pb-24 [transform-style:preserve-3d]"
          >
            <div className="page-shell rounded-[2rem] border border-white/6 px-4 py-7 md:px-8 md:py-10">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>
          </motion.main>
        </div>
        <GlobalFooter />
        <ConsentBanner />

        <div className="hidden md:block">
          <div className="pointer-events-none fixed bottom-6 right-6 z-40 w-[320px]">
            <AdSlot variant="rectangle" className="pointer-events-auto" />
          </div>
        </div>
        <AdSlot variant="mobile-sticky" />
      </div>

      {/* Background Layer (Moved to bottom, negative z-index) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 z-0">
          <WallpaperBase />
        </div>
        <div className="absolute inset-0 z-10 opacity-60">
          <PageWallpaper routeKey={location.pathname} />
          <NetworkBackground />
        </div>
        {showTrail ? <MouseTrail /> : null}
      </div>
    </div>
  );
}
