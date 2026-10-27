import { Link } from "react-router-dom";
import { categories } from "@/data/categories";
import type { ApiReferral } from "@/lib/api";

/**
 * Member boxes — subscribers' own referral links, rendered directly below
 * the hero carousel. Sizing follows the ACSS sizing grid's smaller cell
 * (.acss-cards--dense: 13rem cells); surfaces use the site's glass style.
 *
 * Only member-owned, terms-attested, unflagged public listings appear here
 * (the terms check is the business-model rule: programs that bar public
 * posting are held out).
 */
export function memberBoxListings(referrals: ApiReferral[]): ApiReferral[] {
  return referrals.filter(
    (r) => r.owner === "member" && r.termsAttested === true && r.termsFlagged !== true,
  );
}

export function MemberBoxes({ referrals }: { referrals: ApiReferral[] }) {
  const listings = memberBoxListings(referrals).slice(0, 12);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <section className="mt-12" aria-label="Member referral links">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">
            From our members
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold text-white">
            Member links, posted by subscribers
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Premium members post their best referral links from their dashboard — these boxes are
            theirs. Every poster attested that their program allows public posting.
          </p>
        </div>
        <Link
          to="/premium"
          className="rounded-2xl border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
        >
          Post yours — Premium
        </Link>
      </div>

      {listings.length ? (
        <div className="acss-cards acss-cards--dense mt-6">
          {listings.map((r) => (
            <article
              key={r.id}
              className="glass flex flex-col rounded-3xl border border-white/10 p-4 transition hover:border-neon/40"
            >
              <div className="flex items-center gap-3">
                <img
                  src={r.image}
                  alt=""
                  className="h-10 w-10 rounded-xl bg-white/95 object-contain p-1"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-white">{r.title}</h3>
                  <div className="text-[11px] uppercase tracking-wide text-muted">
                    {catName(r.category)}
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-white/70">
                {r.description}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">
                  {r.clicks} clicks · {r.votes} votes
                </span>
                <a
                  href={`/offer/${r.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-2 text-xs font-bold text-black transition hover:brightness-110 active:scale-95"
                >
                  Get offer →
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass mt-6 rounded-3xl border border-dashed border-white/15 p-6 text-center">
          <p className="text-sm text-white/80">
            No member links are live yet — the first Premium posters will appear right here, under
            the featured carousel.
          </p>
          <Link
            to="/premium"
            className="mt-3 inline-block rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-sm font-bold text-black shadow-gold transition hover:brightness-110"
          >
            Become the first — $3.99/mo
          </Link>
        </div>
      )}
    </section>
  );
}
