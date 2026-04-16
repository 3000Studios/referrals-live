import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/** Periodically nudges engagement metrics to simulate marketplace activity. */
export function useSimulatedPulse(intervalMs = 45000) {
  const simulate = useAppStore((s) => s.simulateActivity);
  useEffect(() => {
    const id = window.setInterval(() => simulate(), intervalMs);
    return () => window.clearInterval(id);
  }, [simulate, intervalMs]);
}
