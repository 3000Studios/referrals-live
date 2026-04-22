import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { sortByNewest, sortByPopular, sortByTrending } from "@/lib/trending";
import { categories } from "@/data/categories";
import { AdSlot } from "@/components/monetization/AdSlot";
import { api } from "@/lib/api";

type Sort = "trending" | "popular" | "newest";

export function Browse() {
  const referrals = useAppStore((s) => s.referrals);
  const [params] = useSearchParams();
  const initialCat = params.get("cat") ?? "all";
  const initialQ = params.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState(initialCat);
  const [sort, setSort] = useState<Sort>("trending");
  const [remoteResults, setRemoteResults] = useState(referrals);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    api
      .searchDiscovery(query, category)
      .then((res) => {
        if (!cancelled) setRemoteResults(res.results as typeof referrals);
      })
      .catch(() => {
        if (!cancelled) setRemoteResults(referrals);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, category, referrals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return remoteResults.filter((r) => {
      const catOk = category === "all" || r.category === category;
      if (!catOk) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [remoteResults, query, category]);

  const sorted = useMemo(() => {
    if (sort === "trending") return sortByTrending(filtered);
    if (sort === "popular") return sortByPopular(filtered);
    return sortByNewest(filtered);
  }, [filtered, sort]);

  return (
    <div>
      <Seo
        title="Browse referral programs — referrals.live"
        description="Search and filter referral programs by category, popularity, and freshness."
        path="/browse"
      />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Marketplace</div>
          <h1 className="font-display text-4xl font-extrabold text-white">Browse referrals</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Instant search + sorting across live member links and the hourly discovery feed.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-3xl border border-white/10 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs uppercase tracking-wide text-muted">
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, tags..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
              />
            </label>
            <label className="text-xs uppercase tracking-wide text-muted">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              >
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase tracking-wide text-muted">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              >
                <option value="trending">Trending</option>
                <option value="popular">Most popular</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
        </div>
        <AdSlot variant="rectangle" />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((r, i) => (
          <ReferralCard key={r.id} referral={r} index={i} />
        ))}
      </div>
      {!sorted.length ? (
        <div className="mt-8 glass rounded-3xl p-6 text-sm text-muted">
          No promo codes matched yet. Try a broader keyword like `bank`, `travel`, `hosting`, or `cashback`.
        </div>
      ) : null}
      <div className="mt-4 text-xs text-muted">{searching ? "Searching the discovery feed…" : `Showing ${sorted.length} results`}</div>
    </div>
  );
}
