import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";

export function Login() {
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    login(email.trim(), password)
      .then(() => {
        const user = useAppStore.getState().user;
        navigate(user?.isAdmin ? "/admin" : "/dashboard");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Login failed."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto max-w-lg">
      <Seo title="Login — referrals.live" description="Access your referrals.live dashboard." path="/login" />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Account</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Login</h1>
      <p className="mt-3 text-sm text-muted">Log in with your email and password to manage referrals, Pro placement, and chat access.</p>
      <form onSubmit={onSubmit} className="mt-8 glass space-y-4 rounded-3xl border border-white/10 p-6">
        <label className="block text-xs uppercase tracking-wide text-muted">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
          />
        </label>
        <label className="block text-xs uppercase tracking-wide text-muted">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-3 text-sm font-semibold text-black shadow-neon disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
        {error ? <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        <div className="text-center text-sm text-muted">
          New here?{" "}
          <Link className="text-electric hover:text-white" to="/register">
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
