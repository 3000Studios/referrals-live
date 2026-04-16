import { useEffect, useRef, useState } from "react";
import { Seo } from "@/components/seo/Seo";

type Board = { score: number; at: string }[];
const KEY = "referrals-empire-runner";

function load(): Board {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Board) : [];
  } catch {
    return [];
  }
}

function save(next: Board) {
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 8)));
}

export function Games() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [display, setDisplay] = useState(0);
  const [board, setBoard] = useState<Board>([]);
  const scoreRef = useRef(0);

  useEffect(() => setBoard(load()), []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const stars = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      s: 1 + Math.random() * 2,
      v: 1 + Math.random() * 2,
    }));

    const player = { x: c.width * 0.5, y: c.height * 0.75, w: 64, h: 14 };
    let obstacles: { x: number; y: number; w: number; h: number; vx: number }[] = [];
    let tick = 0;

    const loop = () => {
      if (!running) return;
      tick++;
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, c.width, c.height);
      for (const s of stars) {
        s.y += s.v;
        if (s.y > c.height) s.y = 0;
        ctx.fillStyle = "rgba(52,211,153,0.35)";
        ctx.fillRect(s.x, s.y, s.s, s.s * 3);
      }

      if (tick % 45 === 0) {
        obstacles.push({ x: c.width + 20, y: 40 + Math.random() * (c.height - 120), w: 90, h: 16, vx: -3.2 });
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x += o.vx;
        ctx.fillStyle = "rgba(16,185,129,0.85)";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        if (o.x + o.w < 0) obstacles.splice(i, 1);
        else if (
          player.x - player.w / 2 < o.x + o.w &&
          player.x + player.w / 2 > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y
        ) {
          obstacles = [];
          scoreRef.current = 0;
          setDisplay(0);
        }
      }

      ctx.fillStyle = "#a7f3d0";
      ctx.fillRect(player.x - player.w / 2, player.y, player.w, player.h);

      scoreRef.current += 0.22;
      setDisplay(Math.floor(scoreRef.current));

      raf = requestAnimationFrame(loop);
    };
    loop();

    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left;
      player.x = (x / rect.width) * c.width;
    };

    c.addEventListener("mousemove", onMove);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      c.removeEventListener("mousemove", onMove);
    };
  }, []);

  const bank = () => {
    const s = Math.floor(scoreRef.current);
    if (s <= 0) return;
    const next = [...load(), { score: s, at: new Date().toISOString() }].sort((a, b) => b.score - a.score);
    save(next);
    setBoard(next);
  };

  return (
    <>
      <Seo title="Arcade — referrals.live" description="Empire runner mini-game with leaderboard." path="/games" />
      <section className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-neon/80">Games</p>
          <h1 className="font-display text-4xl text-white">Neon runner</h1>
          <p className="mt-2 text-sm text-muted">Dodge blocks — bank your score to the leaderboard.</p>
        </header>
        <div className="glass rounded-3xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-3xl text-white">{display}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={bank}
                className="rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
              >
                Bank score
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Move your mouse to steer the bar.</p>
          <canvas ref={canvasRef} width={960} height={420} className="mt-4 w-full rounded-2xl border border-white/10" />
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {board.map((b, i) => (
              <div key={`${b.at}-${i}`} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                <span className="text-muted">#{i + 1}</span>
                <span className="font-mono text-neon">{b.score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
