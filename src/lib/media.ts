const FALLBACK =
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80";

export async function fetchUnsplashFeatured(query: string): Promise<string> {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!key) return FALLBACK;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { results?: { urls?: { regular?: string } }[] };
    return data.results?.[0]?.urls?.regular ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export async function fetchPexelsCurated(query: string): Promise<string> {
  const key = import.meta.env.VITE_PEXELS_API_KEY;
  if (!key) return FALLBACK;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: key } },
    );
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { photos?: { src?: { large2x?: string } }[] };
    return data.photos?.[0]?.src?.large2x ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export async function loadStockImage(query: string): Promise<string> {
  const unsplash = await fetchUnsplashFeatured(query);
  if (unsplash !== FALLBACK) return unsplash;
  return fetchPexelsCurated(query);
}

export const curatedImage = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
