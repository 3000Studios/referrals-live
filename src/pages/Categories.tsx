import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { categories } from "@/data/categories";

export function Categories() {
  return (
    <div>
      <Seo
        title="Referral categories — referrals.live"
        description="Explore referral programs by vertical: fintech, crypto, SaaS, travel, ecommerce, and wellness."
        path="/categories"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Taxonomy</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Categories</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Each category is tuned for conversion copy and sponsor placement opportunities.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/browse?cat=${c.id}`}
            className="glass group rounded-3xl border border-white/10 p-8 transition hover:border-neon/40"
          >
            <div className="text-4xl">{c.icon}</div>
            <div className="mt-4 font-display text-2xl font-bold text-white group-hover:text-neon">{c.name}</div>
            <p className="mt-3 text-sm text-muted">{c.description}</p>
            <div className="mt-6 text-sm font-semibold text-electric">Open listings →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
