import { Link } from "react-router-dom";

const cols = [
  {
    title: "Marketplace",
    links: [
      { to: "/browse", label: "Browse" },
      { to: "/categories", label: "Categories" },
      { to: "/submit", label: "Submit" },
      { to: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/blog", label: "Blog" },
      { to: "/contact", label: "Contact" },
      { to: "/premium", label: "Premium" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/disclosure", label: "Disclosure" },
      { to: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer-wave-wrap relative overflow-hidden border-t border-white/10 bg-black/70">
      <div className="footer-wave" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-[2] mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-xl font-bold text-white">
            referrals<span className="text-neon">.live</span>
          </div>
          <p className="mt-3 text-sm text-white/75">
            The referral marketplace built for creators who want traffic, trust, and monetization in one motion.
          </p>
          <p className="mt-4 text-xs text-white/55">
            © {new Date().getFullYear()} referrals.live. All rights reserved.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{c.title}</div>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link className="hover:text-neon" to={l.to}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
