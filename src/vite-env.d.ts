/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Stock image APIs
  readonly VITE_UNSPLASH_ACCESS_KEY?: string;
  readonly VITE_PEXELS_API_KEY?: string;

  // Canonical URL
  readonly VITE_SITE_URL?: string;
  readonly VITE_API_BASE_URL?: string;

  // Admin
  readonly VITE_OWNER_ADMIN_EMAIL?: string;

  // Owner attribution (appended to referral URLs)
  readonly VITE_OWNER_REF_CODE?: string;
  readonly VITE_OWNER_EMAIL?: string;
  readonly VITE_OWNER_ID?: string;
  readonly VITE_OWNER_PHONE?: string;

  // Stripe checkout fallback (for logged-out visitors)
  readonly VITE_STRIPE_PAYMENT_LINK?: string;

  // PayPal JS SDK subscription
  readonly VITE_PAYPAL_CLIENT_ID?: string;
  readonly VITE_PAYPAL_PLAN_ID?: string;

  // AdSense ad unit slot IDs (create in AdSense dashboard → Ad units)
  readonly VITE_ADSENSE_SLOT_BANNER?: string;
  readonly VITE_ADSENSE_SLOT_RECT?: string;
  readonly VITE_ADSENSE_SLOT_MOBILE?: string;
  readonly VITE_ADSENSE_SLOT_FEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
