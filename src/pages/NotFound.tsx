import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <Seo title="404 — referrals.live" description="Page not found." path="/404" />
      <div className="font-display text-7xl font-black text-neon">404</div>
      <h1 className="mt-4 font-display text-3xl font-bold text-white">This page drifted off-chain</h1>
      <p className="mt-3 text-sm text-muted">The route doesn’t exist (yet). Head back to the marketplace.</p>
      <Link to="/" className="mt-8 inline-flex rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-8 py-3 text-sm font-semibold text-black shadow-neon">
        Go home
      </Link>
    </div>
  );
}
