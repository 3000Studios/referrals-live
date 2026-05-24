import { Seo } from "@/components/seo/Seo";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .testimonials(12, offset)
      .then((res) => setTestimonials(res.testimonials))
      .finally(() => setLoading(false));
  }, [offset]);

  return (
    <div>
      <Seo
        title="Success Stories — referrals.live"
        description="Creator testimonials sharing how they earn money from referral programs."
        path="/testimonials"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Success Stories</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Creator Testimonials</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Read how our top creators monetize referrals and build profitable affiliate businesses.
      </p>

      <div className="mt-10">
        {loading ? (
          <div className="text-center text-muted">Loading testimonials...</div>
        ) : testimonials.length === 0 ? (
          <div className="glass rounded-3xl border border-white/10 p-8 text-center">
            <p className="text-muted">No testimonials yet. Be the first to share your success story!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="glass rounded-3xl border border-white/10 p-6 flex flex-col hover:border-neon/40 transition">
                {/* Creator Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neon/30 to-electric/30 flex items-center justify-center text-lg">
                    {t.creatorAvatar ?? "👤"}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.creatorName}</p>
                    <p className="text-xs text-muted">{t.referralCategory}</p>
                  </div>
                </div>

                {/* Title & Story */}
                <h3 className="font-semibold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-muted line-clamp-4 mb-4 flex-1">{t.story}</p>

                {/* Earnings & Link */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  {t.earnings && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Earnings ({t.timePeriod})</span>
                      <span className="font-bold text-gold">${t.earnings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted">→ {t.referralTitle}</div>
                  <p className="text-xs text-muted">
                    Published: {new Date(t.publishedAt * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {testimonials.length > 0 && (
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => setOffset(Math.max(0, offset - 12))}
              disabled={offset === 0}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50 hover:border-neon/40"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + 12)}
              disabled={testimonials.length < 12}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50 hover:border-neon/40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
