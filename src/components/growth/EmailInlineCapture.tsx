import { FormEvent, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { trackEmailCapture } from "@/lib/analytics";

export function EmailInlineCapture() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const add = useAppStore((s) => s.addEmailCapture);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    add(v, "inline_home").catch(() => null);
    trackEmailCapture("inline_home");
    setEmail("");
    setDone(true);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[rgba(0,255,136,0.04)] via-[rgba(3,4,9,0.92)] to-[rgba(0,204,255,0.03)] p-px">
      {/* Outer glow border */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />
      <div className="relative rounded-3xl p-8 md:flex md:items-center md:justify-between md:gap-10 bg-[rgba(3,4,9,0.88)] backdrop-blur-xl">
        {/* Radial depth lighting */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-neon/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-electric/4 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/6 px-3 py-1 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-glow-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-neon/80">Weekly drops</span>
          </div>
          <div className="font-display text-2xl font-bold text-white leading-tight">
            Get referral drops
            <br />
            <span className="text-gradient-neon">weekly</span>
          </div>
          <p className="mt-2 max-w-sm text-[13px] text-muted leading-relaxed">
            Short, tactical, and built for people who ship. No spam.
          </p>
        </div>

        <div className="relative mt-6 w-full max-w-md md:mt-0">
          {done ? (
            <div className="flex items-center gap-3 rounded-2xl border border-neon/30 bg-neon/8 px-5 py-4">
              <span className="text-xl">✓</span>
              <div>
                <div className="text-sm font-semibold text-neon">You're in.</div>
                <div className="text-xs text-muted mt-0.5">First drop lands this week.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 py-3.5 text-[13px] text-white outline-none placeholder:text-white/25 ring-neon/30 focus:ring focus:border-neon/30 transition-colors"
              />
              <button
                type="submit"
                className="shrink-0 rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-3.5 text-sm font-bold text-black shadow-neon transition hover:brightness-110 hover:shadow-[0_0_24px_rgba(0,255,136,0.5)] active:scale-95"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
