/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNSPLASH_ACCESS_KEY?: string;
  readonly VITE_PEXELS_API_KEY?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_ADSENSE_SLOT_BANNER?: string;
  readonly VITE_ADSENSE_SLOT_RECT?: string;
  readonly VITE_ADSENSE_SLOT_MOBILE?: string;
  readonly VITE_ADSENSE_SLOT_FEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
