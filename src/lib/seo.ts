export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://referrals.live";

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL.replace(/\/$/, "")}${p}`;
}

export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "referrals.live",
    url: SITE_URL,
    logo: absoluteUrl("/favicon.svg"),
    sameAs: ["https://twitter.com/", "https://www.linkedin.com/"],
  };
}

export function jsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "referrals.live",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/browse?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function jsonLdArticle(title: string, slug: string, date: string, excerpt: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: date,
    dateModified: date,
    author: { "@type": "Organization", name: "referrals.live Editorial" },
    publisher: {
      "@type": "Organization",
      name: "referrals.live",
      logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.svg") },
    },
    description: excerpt,
    mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
  };
}
