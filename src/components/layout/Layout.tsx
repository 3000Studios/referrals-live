import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NetworkBackground } from "@/components/three/NetworkBackground";
import { MouseTrail } from "@/components/effects/MouseTrail";
import { Ticker } from "@/components/layout/Ticker";
import { AdSlot } from "@/components/monetization/AdSlot";
import { useSimulatedPulse } from "@/hooks/useSimulatedPulse";
import { PageLoader } from "@/components/layout/PageLoader";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function Layout() {
  const location = useLocation();
  useSimulatedPulse();
  const startIngestionScheduler = useAppStore((s) => s.startIngestionScheduler);
  const stopIngestionScheduler = useAppStore((s) => s.stopIngestionScheduler);
  const [showTrail, setShowTrail] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setShowTrail(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    startIngestionScheduler();
    return () => stopIngestionScheduler();
  }, [startIngestionScheduler, stopIngestionScheduler]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <NetworkBackground />
      {showTrail ? <MouseTrail /> : null}
      <Navbar />
      <Ticker />
      <div className="pt-28">
        <div className="mx-auto max-w-7xl px-4 pb-10">
          <div className="hidden lg:block">
            <AdSlot variant="banner" />
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-7xl px-4 pb-24"
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </motion.main>
        </AnimatePresence>
      </div>
      <Footer />
      <div className="hidden md:block">
        <div className="pointer-events-none fixed bottom-6 right-6 z-40 w-[320px]">
          <AdSlot variant="rectangle" className="pointer-events-auto" />
        </div>
      </div>
      <AdSlot variant="mobile-sticky" />
    </div>
  );
}
