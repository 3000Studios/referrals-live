import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SubState = { cancelAtPeriodEnd: boolean; currentPeriodEnd: number; status: string };

/** Cancel or resume the member's own Premium subscription (ends at period end). */
export function SubscriptionControls({ onChange }: { onChange?: () => void }) {
  const [sub, setSub] = useState<SubState | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .subscription()
      .then((r) => {
        if (r.hasSubscription && r.status === "active") {
          setSub({ cancelAtPeriodEnd: Boolean(r.cancelAtPeriodEnd), currentPeriodEnd: Number(r.currentPeriodEnd ?? 0), status: r.status ?? "active" });
        }
      })
      .catch(() => null);
  }, []);

  if (!sub) return null;

  const endDate = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;

  const run = async (action: "cancel" | "resume") => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await api.manageSubscription(action);
      setSub({ cancelAtPeriodEnd: r.cancelAtPeriodEnd, currentPeriodEnd: r.currentPeriodEnd, status: r.status });
      setMessage(action === "cancel" ? "Cancelled. You keep Premium until the end of the paid period." : "Your Premium will renew as normal.");
      setConfirming(false);
      onChange?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
      {sub.cancelAtPeriodEnd ? (
        <>
          <p className="text-amber-200">Premium is set to end{endDate ? ` on ${endDate}` : " at the end of this period"}. You won't be charged again.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("resume")}
            className="mt-3 rounded-2xl border border-neon/40 px-4 py-2 font-semibold text-neon transition hover:bg-neon/10 active:scale-95 disabled:opacity-50"
          >
            {busy ? "Working…" : "Keep my Premium"}
          </button>
        </>
      ) : confirming ? (
        <>
          <p className="text-white/80">
            Cancel Premium? You keep it{endDate ? ` until ${endDate}` : " until the end of the paid period"}, then your links go back to your private board.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run("cancel")}
              className="rounded-2xl border border-red-400/50 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-500/10 active:scale-95 disabled:opacity-50"
            >
              {busy ? "Working…" : "Yes, cancel at period end"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-2xl border border-white/15 px-4 py-2 text-white/80 hover:bg-white/5">
              Keep Premium
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted">Renews monthly{endDate ? `, next on ${endDate}` : ""}. Cancel anytime and keep access until the period ends.</p>
          <button type="button" onClick={() => setConfirming(true)} className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 underline-offset-4 hover:text-white hover:underline">
            Cancel subscription
          </button>
        </>
      )}
      {message ? <p className="mt-3 text-xs text-white/70" role="status">{message}</p> : null}
    </div>
  );
}
