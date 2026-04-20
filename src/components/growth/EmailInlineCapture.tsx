import { FormEvent, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { trackEmailCapture } from "@/lib/analytics";

export function EmailInlineCapture() {
  const [email, setEmail] = useState("");
  const add = useAppStore((s) => s.addEmailCapture);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    add(v, "inline_home").catch(() => null);
    trackEmailCapture("inline_home");
    setEmail("");
  };

  return (
    <div className="glass neon-ring rounded-3xl border border-white/10 p-8 md:flex md:items-center md:justify-between md:gap-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Email capture</div>
        <div className="mt-2 font-display text-2xl font-bold text-white">Get referral drops weekly</div>
        <p className="mt-2 max-w-xl text-sm text-muted">Short, tactical, and built for people who ship.</p>
      </div>
      <form onSubmit={submit} className="mt-6 flex w-full max-w-md flex-col gap-3 md:mt-0 md:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-neon/30 focus:ring"
        />
        <button
          type="submit"
          className="rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-3 text-sm font-semibold text-black shadow-neon"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
