import { Helmet } from "react-helmet-async";
import { absoluteUrl, jsonLdArticle, jsonLdOrganization, jsonLdWebSite, SITE_URL } from "@/lib/seo";
import type { BlogArticle } from "@/types";

type Props = {
  title: string;
  description: string;
  path: string;
  image?: string;
  article?: BlogArticle;
};

const DEFAULT_OG =
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80&fm=jpg";

export function Seo({ title, description, path, image = DEFAULT_OG, article }: Props) {
  const url = absoluteUrl(path);
  const img = image.startsWith("http") ? image : absoluteUrl(image);
  const org = JSON.stringify(jsonLdOrganization());
  const site = JSON.stringify(jsonLdWebSite());
  const articleLd = article ? JSON.stringify(jsonLdArticle(article.title, article.slug, article.date, article.excerpt)) : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      <meta name="theme-color" content="#050508" />
      <script type="application/ld+json">{org}</script>
      <script type="application/ld+json">{site}</script>
      {articleLd ? <script type="application/ld+json">{articleLd}</script> : null}
      <link rel="sitemap" type="application/xml" title="Sitemap" href={`${SITE_URL}/sitemap.xml`} />
    </Helmet>
  );
}
