import { useEffect, useState } from "react";
import { api, type ModerationItem } from "@/lib/api";

type Action = "approve" | "hide" | "restore" | "make_private";

/**
 * Admin queue for member listings: pending posts, listings hidden after
 * member reports, and live listings with any reports. Every action is
 * written to the moderation log on the server.
 */
export function ModerationPanel() {
  const [items, setItems] = useState<ModerationItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"attention" | "all">("attention");

  const load = () =>
    api
      .moderationQueue()
      .then((r) => setItems(r.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the queue."));

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: Action) => {
    setBusy(id + action);
    setError(null);
    try {
      await api.moderate(id, action);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action failed.");
    } finally {
      setBusy(null);
    }
  };

  const needsAttention = (i: ModerationItem) => i.hidden || i.reports > 0 || i.status === "public_candidate";
  const shown = (items ?? []).filter((i) => (filter === "all" ? true : needsAttention(i)));
  const counts = {
    pending: (items ?? []).filter((i) => i.status === "public_candidate" && !i.hidden).length,
    hidden: (items ?? []).filter((i) => i.hidden).length,
    reported: (items ?? []).filter((i) => i.reports > 0).length,
  };

  const btn = "rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-40";

  return (
    <div className="glass rounded-3xl border border-white/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Community moderation</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Premium posts that pass the spam checks go live straight away. Three member reports hide a listing until you
            restore it. Pending posts are older submissions waiting on your approval; check none of them are private
            links before approving.
          </p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full bg-amber-400/15 px-3 py-1 font-bold text-amber-300">{counts.pending} pending</span>
          <span className="rounded-full bg-red-400/15 px-3 py-1 font-bold text-red-300">{counts.hidden} hidden</span>
          <span className="rounded-full bg-white/10 px-3 py-1 font-bold text-white/70">{counts.reported} reported</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {(["attention", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`${btn} ${filter === f ? "border-electric/60 bg-electric/10 text-electric" : "border-white/10 text-white/60 hover:text-white"}`}
          >
            {f === "attention" ? "Needs attention" : "All member listings"}
          </button>
        ))}
      </div>

      {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

      <div className="mt-4 grid gap-3">
        {items === null ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">Nothing needs you right now.</div>
        ) : (
          shown.map((i) => (
            <div key={i.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{i.title}</div>
                  <div className="mt-1 break-all text-[11px] text-white/50">{i.url}</div>
                  <div className="mt-1 text-[11px] text-muted">
                    by {i.poster} · {new Date(i.createdAt).toLocaleDateString()} ·{" "}
                    {i.hidden ? <span className="text-red-300">hidden</span> : i.status === "public" ? <span className="text-neon">live</span> : i.status === "public_candidate" ? <span className="text-amber-300">pending</span> : <span>private</span>}
                    {i.reports ? ` · ${i.reports} report${i.reports === 1 ? "" : "s"}` : ""}
                    {i.termsAttested ? "" : " · terms not confirmed"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {i.status !== "public" || i.hidden ? (
                    <button type="button" disabled={busy !== null} onClick={() => act(i.id, "approve")} className={`${btn} border-neon/40 text-neon hover:bg-neon/10`}>
                      Approve
                    </button>
                  ) : null}
                  {i.hidden ? (
                    <button type="button" disabled={busy !== null} onClick={() => act(i.id, "restore")} className={`${btn} border-electric/40 text-electric hover:bg-electric/10`}>
                      Restore
                    </button>
                  ) : (
                    <button type="button" disabled={busy !== null} onClick={() => act(i.id, "hide")} className={`${btn} border-red-400/40 text-red-300 hover:bg-red-400/10`}>
                      Hide
                    </button>
                  )}
                  {i.status !== "private" ? (
                    <button type="button" disabled={busy !== null} onClick={() => act(i.id, "make_private")} className={`${btn} border-white/15 text-white/70 hover:bg-white/5`}>
                      Make private
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
