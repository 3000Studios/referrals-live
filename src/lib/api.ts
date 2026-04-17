import { useAppStore } from "@/store/useAppStore";
import type { IngestionRun, Referral } from "@/types";

/**
 * API facade that mirrors planned backend endpoints while currently delegating
 * to local persisted store state. This keeps the UI contract stable for a future
 * server implementation.
 */
export const api = {
  async getPublicReferrals(): Promise<Referral[]> {
    return useAppStore.getState().referrals;
  },

  async saveOwnerProfile(providerId: string, params: Record<string, string>, updatedBy: string): Promise<void> {
    useAppStore.getState().saveOwnerProfile(providerId, params, updatedBy);
  },

  async runIngestion(source = "manual-api"): Promise<void> {
    useAppStore.getState().runIngestion(source);
  },

  async getIngestionRuns(): Promise<IngestionRun[]> {
    return useAppStore.getState().ingestionRuns;
  },
};

