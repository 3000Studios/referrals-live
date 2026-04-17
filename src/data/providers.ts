import type { Provider } from "@/types";

export const defaultProviders: Provider[] = [
  {
    id: "generic-example",
    name: "Generic Example Network",
    domain: "example.com",
    attributionTemplate: "https://example.com/:path?ref={ref_code}&affiliate_id={owner_id}",
    requiredParams: ["ref_code", "owner_id"],
    status: "active",
  },
];

