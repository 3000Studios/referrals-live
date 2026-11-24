import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { api, type ReportReason } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

const REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: "spam", label: "Spam or repeated" },
  { id: "broken", label: "Broken or expired link" },
  { id: "scam", label: "Scam or misleading" },
  { id: "not_allowed", label: "Program doesn't allow public posting" },
  { id: "offensive", label: "Offensive" },
  { id: "other", label: "Something else" },
];

/**
 * Lets signed-in members flag a member listing. Three reports from
 * different members hide it until an admin reviews it.
 */
export function ReportButton({ referralId, className }: { referralId: string; className?: string }) {
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const send = async (reason: ReportReason) => {
    setState("sending");
    try {
      const res = await api.reportListing(referralId, reason);
      setState("done");
      setMessage(res.alreadyReported ? "You already reported this one." : "Thanks. A moderator will take a look.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Couldn't send that report.");
    }
  };

  if (state === "done") {
    return <span className={clsx("text-[11px] text-white/60", className)} role="status">{message}</span>;
  }

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (!user) {
            navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
            return;
          }
          setOpen((v) => !v);
        }}
        className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 transition hover:border-red-400/40 hover:text-red-300"
      >
        ⚑ Report
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-30 mb-2 w-60 rounded-2xl border border-white/10 bg-[rgba(6,8,16,0.97)] p-2 shadow-2xl backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Why report it?</div>
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="menuitem"
              disabled={state === "sending"}
              onClick={() => send(r.id)}
              className="block w-full rounded-xl px-3 py-2 text-left text-xs text-white/80 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
          {state === "error" ? <div className="px-3 pb-1 pt-1 text-[11px] text-red-300">{message}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
