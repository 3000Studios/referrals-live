import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";

export function Login() {
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(email.trim(), password);
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto max-w-lg">
      <Seo title="Login — referrals.live" description="Access your referrals.live dashboard." path="/login" />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Account</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Login</h1>
      <p className="mt-3 text-sm text-muted">Demo auth stores session locally — swap for Supabase/Auth0/Clerk.</p>
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
          className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-3 text-sm font-semibold text-black shadow-neon"
        >
          Continue
        </button>
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
