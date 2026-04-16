type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

const queue: AnalyticsPayload[] = [];

/** Hook-ready analytics: wire to GA4, Plausible, or Cloudflare Web Analytics. */
export function trackEvent(name: string, payload?: AnalyticsPayload) {
  const merged = { event: name, ts: Date.now(), ...payload };
  queue.push(merged);
  if (import.meta.env.DEV) {
    console.debug("[analytics]", merged);
  }
  window.dispatchEvent(new CustomEvent("referrals:analytics", { detail: merged }));
}

export function trackOutboundClick(referralId: string, url: string) {
  trackEvent("outbound_click", { referralId, url });
}

export function trackVote(referralId: string) {
  trackEvent("vote", { referralId });
}

export function trackShare(channel: string, referralId?: string) {
  trackEvent("share", { channel, referralId });
}

export function trackEmailCapture(source: string) {
  trackEvent("email_capture", { source });
}

export function trackPremiumView(plan: string) {
  trackEvent("premium_view", { plan });
}

export function getAnalyticsQueue() {
  return [...queue];
}
