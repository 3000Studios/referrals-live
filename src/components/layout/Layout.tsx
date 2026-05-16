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

export function Layout() {
  const location = useLocation();
  const hydrate = useAppStore((s) => s.hydrate);
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

  return (
    <div className="relative min-h-screen bg-[#04060c]">
      {/* UI Layer */}
      <div className="relative z-10 pb-[100px] md:pb-[300px]">
        <GlobalNav />
        <Navbar />
        <Ticker />
        <div className="pt-8">
          <div className="mx-auto max-w-7xl px-4 pb-10">
            <div className="hidden lg:block">
              <AdSlot variant="banner" />
            </div>
          </div>
          
          <motion.main
            initial={{ opacity: 0, y: 42, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            animate={{ opacity: 1 }}
            viewport={{ amount: 0.08 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mx-auto max-w-7xl px-4 pb-24 [transform-style:preserve-3d]"
          >
            <div className="page-shell rounded-[2rem] border border-white/10 bg-[rgba(4,6,12,0.91)] px-4 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-sm md:px-6 md:py-8">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>
          </motion.main>
        </div>
        <GlobalFooter />
        
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
