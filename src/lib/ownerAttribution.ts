const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL?.trim() ?? "";
const OWNER_REF_CODE = import.meta.env.VITE_OWNER_REF_CODE?.trim() ?? "";
const OWNER_ID = import.meta.env.VITE_OWNER_ID?.trim() ?? "";
const OWNER_PHONE = import.meta.env.VITE_OWNER_PHONE?.trim() ?? "";

export const defaultOwnerParams = {
  ref_code: OWNER_REF_CODE,
  owner_id: OWNER_ID,
  owner_email: OWNER_EMAIL,
  owner_phone: OWNER_PHONE,
};

/**
 * Ensures every referral URL carries owner attribution parameters.
 * This is a stopgap until provider-specific templates/admin mapping is implemented.
 */
export function applyOwnerAttribution(rawUrl: string): string {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (OWNER_REF_CODE) url.searchParams.set("ref", OWNER_REF_CODE);
    if (OWNER_EMAIL) url.searchParams.set("ref_email", OWNER_EMAIL);
    if (OWNER_ID) url.searchParams.set("ref_owner_id", OWNER_ID);
    if (OWNER_PHONE) url.searchParams.set("ref_phone", OWNER_PHONE);

    url.searchParams.set("utm_source", "referrals_live");
    url.searchParams.set("utm_medium", "referral_card");
    url.searchParams.set("utm_campaign", "owner_attribution");
    return url.toString();
  } catch {
    return rawUrl;
  }
}

