import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

type ChatMessage = { id: string; ts: number; user: string; role: string; text: string; avatar?: string; color?: string };
const avatarMap: Record<string, string> = {
  spark: "✦",
  cube: "◼",
  bolt: "⚡",
  crown: "♛",
  ghost: "☁",
  star: "★",
  wave: "≈",
};
const colorMap: Record<string, string> = {
  neon: "text-neon",
  electric: "text-electric",
  gold: "text-gold",
  purple: "text-violet-300",
  white: "text-white",
};

export function LiveChatDock({ defaultOpen = false, className }: { defaultOpen?: boolean; className?: string }) {
  const user = useAppStore((s) => s.user);
  const [serverCanPost, setServerCanPost] = useState(false);
  const canPost = Boolean(user?.premium) && serverCanPost;
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [presence, setPresence] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const headerLabel = useMemo(() => (canPost ? "Live chat" : "Live chat (Premium to post)"), [canPost]);

  useEffect(() => {
    if (!open) return;
    const ws = new WebSocket(api.chatWsUrl());
    wsRef.current = ws;
    ws.addEventListener("message", (evt) => {
      try {
        const data = JSON.parse(String(evt.data));
        if (data?.type === "init") {
          setMessages((data.messages ?? []) as ChatMessage[]);
          return;
        }
        if (data?.type === "cap") {
          setServerCanPost(Boolean(data.canPost));
          return;
        }
        if (data?.type === "presence") {
          setPresence(Number(data.count ?? 0));
          return;
        }
        if (data?.type === "msg") {
          setMessages((m) => [...m, data.message].slice(-100));
        }
      } catch {}
    });
    return () => {
      try {
        ws.close();
      } catch {}
      wsRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (!canPost) return;
    wsRef.current?.send(
      JSON.stringify({
        type: "msg",
        user: user?.displayName ?? "member",
        role: "member",
        text: t,
        avatar: user?.avatar ?? "spark",
        color: user?.color ?? "neon",
      }),
    );
    setText("");
  };

  return (
    <div className={clsx("pointer-events-auto", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white hover:border-neon/40"
      >
        <span>{headerLabel}</span>
        <span className={clsx("text-xs", open ? "text-neon" : "text-muted")}>{open ? "Hide" : "Open"}</span>
      </button>

      {open ? (
        <div className="mt-2 glass rounded-2xl border border-white/10 bg-black/50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted">
            <span>Members online</span>
            <span className="text-neon">{presence}</span>
          </div>
          <div ref={listRef} className="h-64 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((m) => (
              <div key={m.id} className="mb-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/40 text-xs text-white">
                    {avatarMap[m.avatar ?? ""] ?? "•"}
                  </span>
                  <span className={clsx("font-semibold", colorMap[m.color ?? ""] ?? "text-white")}>{m.user}</span>
                  <span>· {new Date(m.ts).toLocaleTimeString()}</span>
                </div>
                <div className={clsx("leading-snug", m.role === "system" ? "text-electric" : "text-white/90")}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-3">
            {canPost ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["Best fintech code today?", "What converted for you?", "Anybody testing travel offers?"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setText(preset)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/80 hover:border-neon/40"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Say something…"
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-neon/30 focus:ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                />
                <button
                  type="button"
                  onClick={send}
                  className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-black shadow-neon"
                >
                  Send
                </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="text-muted">Upgrade to Premium to post messages.</div>
                <a
                  href="/premium"
                  className="rounded-xl border border-gold/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gold hover:bg-gold/10"
                >
                  Upgrade
                </a>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
