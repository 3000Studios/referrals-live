import { motion, AnimatePresence } from "framer-motion";
import { type FormEvent, useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { trackEmailCapture } from "@/lib/analytics";

export function EmailCaptureModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const add = useAppStore((s) => s.addEmailCapture);

  useEffect(() => {
    const seen = sessionStorage.getItem("rl-email-modal");
    if (seen) return;
    const t = window.setTimeout(() => setOpen(true), 9000);
    return () => window.clearTimeout(t);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    add(v, "modal").catch(() => null);
    trackEmailCapture("modal");
    sessionStorage.setItem("rl-email-modal", "1");
    setOpen(false);
  };

  const dismiss = () => {
    sessionStorage.setItem("rl-email-modal", "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="glass neon-ring w-full max-w-lg rounded-3xl border border-white/10 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rl-email-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div id="rl-email-title" className="font-display text-xl font-bold text-white">
                  Get the weekly top referrals
                </div>
                <p className="mt-2 text-sm text-muted">
                  One email. Fresh programs. No spam — unsubscribe anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-xl border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-muted hover:text-white"
              >
                Close
              </button>
            </div>
            <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
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
                Join list
              </button>
            </form>
            <p className="mt-3 text-[11px] text-muted">
              By subscribing you agree we may process your email per our Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
