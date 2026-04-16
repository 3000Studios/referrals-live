import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";

export function Register() {
  const register = useAppStore((s) => s.register);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    register(email.trim(), password, name.trim() || "Creator");
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto max-w-lg">
      <Seo title="Register — referrals.live" description="Create your referrals.live account." path="/register" />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Account</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Create account</h1>
      <p className="mt-3 text-sm text-muted">Local profile + gamification hooks activate instantly.</p>
      <form onSubmit={onSubmit} className="mt-8 glass space-y-4 rounded-3xl border border-white/10 p-6">
        <label className="block text-xs uppercase tracking-wide text-muted">
          Display name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
          />
        </label>
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
          Start earning
        </button>
        <div className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link className="text-electric hover:text-white" to="/login">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
