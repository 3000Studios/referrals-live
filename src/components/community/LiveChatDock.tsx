import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { checkChatText } from "../../../shared/moderation";
import { useAppStore } from "@/store/useAppStore";

type ChatMessage = {
  id: string;
  ts: number;
  user: string;
  role: string;
  text: string;
  avatar?: string;
  color?: string;
  reactions?: Record<string, string[]>;
};
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

const REACTIONS = ["👍", "❤️", "🔥", "🎉", "💸", "👀", "🙌", "🚀"];
const EMOJIS = [
  "😀", "😂", "😍", "🤩", "🤔", "😎", "🥳", "😅",
  "🔥", "💯", "💸", "💰", "🤑", "🏆", "✨", "⚡",
  "👍", "👏", "🙌", "🤝", "💪", "🚀", "📈", "📊",
  "❤️", "💚", "💙", "💜", "🎉", "👀", "😱", "🤯",
];
const SLASH_COMMANDS: Array<{ cmd: string; hint: string }> = [
  { cmd: "/help", hint: "Show available commands" },
  { cmd: "/share", hint: "/share <referrals.live link> — point the room at your listing" },
  { cmd: "/wave", hint: "Send a quick wave to the room" },
  { cmd: "/me", hint: "/me <action> — narrate an action" },
  { cmd: "/tip", hint: "Random tip for boosting referrals" },
];
const TIPS = [
  "Stack your referral codes on high-intent pages — homepage, /premium, and /dashboard.",
  "Reply to questions before pasting your link. Conversion is 4x higher.",
  "Pair financial offers with utility offers — different intents convert separately.",
  "Use the program page to copy your URL with parameters baked in.",
  "Featured cards get the biggest click rate — keep them fresh weekly.",
];

export function LiveChatDock({ defaultOpen = false, className }: { defaultOpen?: boolean; className?: string }) {
  const user = useAppStore((s) => s.user);
  const [serverCanPost, setServerCanPost] = useState(false);
  const canPost = Boolean(user?.premium) && serverCanPost;
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [presence, setPresence] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [conn, setConn] = useState<"connecting" | "live" | "offline">("connecting");
  const [notice, setNotice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sentLogRef = useRef<number[]>([]);
  const lastTextRef = useRef<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  const headerLabel = useMemo(() => (canPost ? "Live chat" : "Live chat (Premium to post)"), [canPost]);

  useEffect(() => {
    if (!open) return;
    let closedByUs = false;
    let attempt = 0;
    let retryTimer: number | undefined;

    const connect = () => {
      setConn("connecting");
      const ws = new WebSocket(api.chatWsUrl());
      wsRef.current = ws;
      ws.addEventListener("open", () => {
        attempt = 0;
        setConn("live");
      });
      ws.addEventListener("close", () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (closedByUs) return;
        setConn("offline");
        // Back off so a flaky phone connection doesn't hammer the room.
        attempt += 1;
        const wait = Math.min(30000, 1500 * 2 ** Math.min(attempt, 5));
        retryTimer = window.setTimeout(connect, wait);
      });
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
            return;
          }
          if (data?.type === "removed" && data.messageId) {
            setMessages((m) => m.filter((msg) => msg.id !== data.messageId));
            return;
          }
          if (data?.type === "rejected" && typeof data.reason === "string") {
            setNotice(String(data.reason).slice(0, 200));
            return;
          }
          if (data?.type === "react" && data.messageId) {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === data.messageId ? { ...msg, reactions: data.reactions ?? {} } : msg,
              ),
            );
            return;
          }
          if (data?.type === "typing" && typeof data.user === "string") {
            const name = String(data.user);
            setTypingUsers((prev) => ({ ...prev, [name]: Date.now() }));
          }
        } catch {}
      });
    };

    connect();
    return () => {
      closedByUs = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [notice]);

  // Sweep stale typing indicators every second
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setTypingUsers((prev) => {
        const cutoff = Date.now() - 4000;
        let changed = false;
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v >= cutoff) next[k] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const broadcastTyping = () => {
    if (!canPost) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;
    lastTypingSentRef.current = now;
    try {
      ws.send(JSON.stringify({ type: "typing", user: user?.displayName ?? "member" }));
    } catch {}
  };

  const sendRaw = (payload: object) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    try {
      ws.send(JSON.stringify(payload));
    } catch {}
  };

  const sendMessage = (raw: string) => {
    if (!canPost) return;
    const verdict = checkChatText(raw);
    if (!verdict.ok) {
      setNotice(verdict.reason);
      return;
    }
    const t = verdict.text ?? raw.trim();
    // Flood limits: one message every 3 seconds, five per 30 seconds, and
    // no repeating the same message back to back. The room enforces the
    // same limits server-side.
    const now = Date.now();
    const recent = sentLogRef.current.filter((ts) => now - ts < 30000);
    if (recent.length && now - recent[recent.length - 1]! < 3000) {
      setNotice("Slow down a little. One message every few seconds.");
      return;
    }
    if (recent.length >= 5) {
      setNotice("You've sent 5 messages in 30 seconds. Take a short breather.");
      return;
    }
    if (t.toLowerCase() === lastTextRef.current.toLowerCase()) {
      setNotice("You just sent that.");
      return;
    }
    sentLogRef.current = [...recent, now];
    lastTextRef.current = t;
    sendRaw({
      type: "msg",
      user: user?.displayName ?? "member",
      role: "member",
      text: t,
      avatar: user?.avatar ?? "spark",
      color: user?.color ?? "neon",
    });
  };

  const handleSlashCommand = (raw: string): boolean => {
    const t = raw.trim();
    if (!t.startsWith("/")) return false;
    const [head, ...rest] = t.split(/\s+/);
    const arg = rest.join(" ").trim();
    switch (head) {
      case "/help": {
        const help = "Commands: " + SLASH_COMMANDS.map((c) => c.cmd).join(", ");
        sendMessage(help);
        return true;
      }
      case "/wave": {
        sendMessage("👋 waves at the room");
        return true;
      }
      case "/share": {
        if (!arg) {
          sendMessage("/share usage: paste a referral URL after the command");
          return true;
        }
        if (!/^https:\/\/(www\.)?referrals\.live\//i.test(arg)) {
          setNotice("Post your link as a listing from your dashboard, then /share its referrals.live page here.");
          return true;
        }
        sendMessage(`🔗 ${user?.displayName ?? "member"} shared: ${arg}`);
        return true;
      }
      case "/me": {
        if (!arg) return true;
        sendMessage(`* ${user?.displayName ?? "member"} ${arg}`);
        return true;
      }
      case "/tip": {
        const tip = TIPS[Math.floor(Math.random() * TIPS.length)]!;
        sendMessage(`💡 Tip: ${tip}`);
        return true;
      }
      default:
        sendMessage(`Unknown command ${head}. Try /help.`);
        return true;
    }
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (!canPost) return;
    if (handleSlashCommand(t)) {
      setText("");
      setShowSlash(false);
      return;
    }
    sendMessage(t);
    setText("");
    setShowSlash(false);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!canPost) return;
    sendRaw({ type: "react", messageId, emoji, user: user?.displayName ?? "member" });
  };

  const insertAtCursor = (insert: string) => {
    const el = inputRef.current;
    if (!el) {
      setText((t) => t + insert);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + insert + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      try {
        el.setSelectionRange(pos, pos);
      } catch {}
    });
  };

  const typingDisplay = useMemo(() => {
    const me = user?.displayName ?? "";
    const others = Object.keys(typingUsers).filter((u) => u && u !== me);
    if (!others.length) return "";
    if (others.length === 1) return `${others[0]} is typing…`;
    if (others.length === 2) return `${others[0]} and ${others[1]} are typing…`;
    return `${others.length} members typing…`;
  }, [typingUsers, user?.displayName]);

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
            <span className="flex items-center gap-2">
              <span
                className={clsx(
                  "h-2 w-2 rounded-full",
                  conn === "live" ? "bg-neon animate-pulse" : conn === "connecting" ? "bg-gold" : "bg-red-400",
                )}
                aria-hidden
              />
              {conn === "live" ? "Members online" : conn === "connecting" ? "Connecting…" : "Reconnecting…"}
            </span>
            <span className="text-neon">{presence}</span>
          </div>
          <div className="border-b border-white/5 px-4 py-1.5 text-[11px] text-white/50">
            Moderated room: be kind, no spam, no scams. Share outside links as a listing, then point to it here.
          </div>
          <div ref={listRef} className="h-72 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((m) => {
              const reactions = m.reactions ?? {};
              const reactionEntries = Object.entries(reactions).filter(([, list]) => list && list.length);
              const me = user?.displayName ?? "";
              return (
                <div key={m.id} className="group mb-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/40 text-xs text-white">
                      {avatarMap[m.avatar ?? ""] ?? "•"}
                    </span>
                    <span className={clsx("font-semibold", colorMap[m.color ?? ""] ?? "text-white")}>{m.user}</span>
                    <span>· {new Date(m.ts).toLocaleTimeString()}</span>
                  </div>
                  <div className={clsx("leading-snug", m.role === "system" ? "text-electric" : m.role === "bot" ? "text-neon" : "text-white/90")}>{m.text}</div>
                  {(reactionEntries.length > 0 || canPost) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {reactionEntries.map(([emoji, list]) => {
                        const mine = me && list.includes(me);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(m.id, emoji)}
                            disabled={!canPost}
                            title={list.slice(0, 5).join(", ") + (list.length > 5 ? ` +${list.length - 5}` : "")}
                            className={clsx(
                              "rounded-full border px-2 py-0.5 text-[11px] transition",
                              mine
                                ? "border-neon/50 bg-neon/15 text-white"
                                : "border-white/10 bg-black/30 text-white/80 hover:border-white/30",
                              canPost ? "cursor-pointer" : "cursor-default opacity-80",
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="ml-1 text-[10px] text-muted">{list.length}</span>
                          </button>
                        );
                      })}
                      {canPost && (
                        <div className="opacity-0 transition group-hover:opacity-100">
                          <details className="relative">
                            <summary className="cursor-pointer list-none rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-white/60 hover:border-white/30">
                              + react
                            </summary>
                            <div className="absolute z-10 mt-1 flex gap-1 rounded-2xl border border-white/10 bg-black/80 px-2 py-1 shadow-lg">
                              {REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(m.id, emoji)}
                                  className="text-base hover:scale-125 transition"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/10 p-3">
            {typingDisplay ? (
              <div className="mb-2 text-[11px] italic text-muted">{typingDisplay}</div>
            ) : null}
            {notice ? (
              <div role="status" className="mb-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[12px] text-gold">
                {notice}
              </div>
            ) : null}
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
                {showSlash && (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-2 text-xs">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted">Slash commands</div>
                    <div className="space-y-0.5">
                      {SLASH_COMMANDS.map((sc) => (
                        <button
                          key={sc.cmd}
                          type="button"
                          onClick={() => {
                            setText(sc.cmd + " ");
                            inputRef.current?.focus();
                          }}
                          className="block w-full rounded px-1 text-left text-white/85 hover:bg-white/5"
                        >
                          <span className="font-mono text-neon">{sc.cmd}</span>
                          <span className="ml-2 text-muted">{sc.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {emojiOpen && (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-2">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            insertAtCursor(e);
                          }}
                          className="rounded p-1 text-lg hover:bg-white/10"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiOpen((v) => !v);
                      setShowSlash(false);
                    }}
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm",
                      emojiOpen ? "border-neon/40 text-neon" : "border-white/10 text-white/80 hover:border-white/30",
                    )}
                    title="Emoji picker"
                  >
                    😀
                  </button>
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => {
                      const v = e.target.value;
                      setText(v);
                      setShowSlash(v.startsWith("/"));
                      broadcastTyping();
                    }}
                    placeholder="Say something… (try /help)"
                    maxLength={400}
                    aria-label="Chat message"
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
                <div className="text-muted">
                  {user?.premium && conn === "live"
                    ? "Your Premium is active. Refresh the page if posting doesn't unlock."
                    : user
                      ? "Upgrade to Premium to post messages and react."
                      : "Log in and go Premium to post messages and react."}
                </div>
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
