import { useEffect, useMemo, useRef } from "react";

function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Vec2 = { x: number; y: number };

export function PageWallpaper({ routeKey }: { routeKey: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seed = useMemo(() => hashSeed(routeKey), [routeKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let disposed = false;
    const pointer: Vec2 = { x: 0.5, y: 0.4 };
    const tilt: Vec2 = { x: 0, y: 0 };
    const scroll = { y: 0 };

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const ratio = dpr();
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const onPointer = (clientX: number, clientY: number) => {
      pointer.x = clamp(clientX / Math.max(1, window.innerWidth), 0, 1);
      pointer.y = clamp(clientY / Math.max(1, window.innerHeight), 0, 1);
    };

    const onMove = (e: PointerEvent) => onPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onPointer(t.clientX, t.clientY);
    };

    const onScroll = () => {
      scroll.y = window.scrollY || 0;
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      // gamma: left-right, beta: front-back. Keep subtle.
      const gx = clamp((e.gamma ?? 0) / 30, -1, 1);
      const gy = clamp((e.beta ?? 0) / 30, -1, 1);
      tilt.x = gx;
      tilt.y = gy;
    };

    resize();
    onScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("deviceorientation", onOrientation);

    const rand = (() => {
      let s = seed || 1;
      return () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return ((s >>> 0) % 10_000) / 10_000;
      };
    })();

    const nodes = Array.from({ length: 58 }).map(() => ({
      x: rand(),
      y: rand(),
      z: rand(),
      r: 0.8 + rand() * 1.6,
    }));

    const draw = (t: number) => {
      if (disposed) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const time = t * 0.00008;
      const parX = (pointer.x - 0.5) * 2 + tilt.x * 0.6;
      const parY = (pointer.y - 0.45) * 2 + tilt.y * 0.6;
      const scrollPhase = (scroll.y / Math.max(1, h)) * 0.9;

      // Base vignette
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.4, 80, w * 0.5, h * 0.4, Math.max(w, h) * 0.78);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.65)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // Aurora blobs (slow 3D-ish parallax)
      const blob = (cx: number, cy: number, color: string, radius: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      };
      blob(w * (0.18 + 0.05 * Math.sin(time + seed)), h * (0.22 + 0.05 * Math.cos(time * 1.2)), "rgba(0,255,136,0.12)", Math.max(w, h) * 0.32);
      blob(w * (0.78 + 0.04 * Math.sin(time * 1.1 + 2)), h * (0.18 + 0.05 * Math.cos(time + 1)), "rgba(0,204,255,0.10)", Math.max(w, h) * 0.28);
      blob(w * (0.52 + 0.06 * Math.cos(time * 0.9 + 3)), h * (0.80 + 0.05 * Math.sin(time * 1.3)), "rgba(120,80,255,0.10)", Math.max(w, h) * 0.30);

      // Perspective grid + nodes (wireframe feel)
      ctx.save();
      ctx.globalAlpha = 0.9;
      const gridShiftX = parX * 18;
      const gridShiftY = parY * 14;
      const horizon = h * (0.38 + 0.05 * Math.sin(scrollPhase));
      const gridColor = "rgba(0,255,136,0.08)";
      const gridColor2 = "rgba(0,204,255,0.06)";

      for (let i = 0; i < 22; i++) {
        const p = i / 21;
        const y = horizon + p * (h - horizon);
        const a = 0.2 + (1 - p) * 0.18;
        ctx.strokeStyle = i % 2 === 0 ? gridColor : gridColor2;
        ctx.globalAlpha = a;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0 + gridShiftX * (1 - p), y + gridShiftY * (1 - p));
        ctx.lineTo(w + gridShiftX * (1 - p), y + gridShiftY * (1 - p));
        ctx.stroke();
      }
      for (let i = -8; i <= 8; i++) {
        const x = w * (0.5 + i * 0.055);
        ctx.strokeStyle = i % 2 === 0 ? gridColor2 : gridColor;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.moveTo(x + gridShiftX, horizon + gridShiftY);
        ctx.lineTo(w * 0.5 + (x - w * 0.5) * 2.2 + gridShiftX * 0.2, h + gridShiftY * 0.2);
        ctx.stroke();
      }
      ctx.restore();

      // Nodes + links (subtle)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cx = w * (0.5 + parX * 0.05);
      const cy = h * (0.42 + parY * 0.05);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const depth = 0.35 + n.z * 0.85;
        const x = cx + (n.x - 0.5) * w * 1.05 * depth + Math.sin(time * 2 + i) * 6;
        const y = cy + (n.y - 0.5) * h * 0.85 * depth + Math.cos(time * 2.2 + i * 0.7) * 6;
        const r = n.r * (0.8 + (1 - depth) * 0.6);
        ctx.fillStyle = i % 3 === 0 ? "rgba(0,255,136,0.22)" : i % 3 === 1 ? "rgba(0,204,255,0.18)" : "rgba(120,80,255,0.16)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (((i + j + seed) % 13) !== 0) continue;
          const a = nodes[i];
          const b = nodes[j];
          const da = 0.35 + a.z * 0.85;
          const db = 0.35 + b.z * 0.85;
          const ax = cx + (a.x - 0.5) * w * 1.05 * da;
          const ay = cy + (a.y - 0.5) * h * 0.85 * da;
          const bx = cx + (b.x - 0.5) * w * 1.05 * db;
          const by = cy + (b.y - 0.5) * h * 0.85 * db;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > Math.min(w, h) * 0.42) continue;
          ctx.strokeStyle = "rgba(0,255,136,0.08)";
          ctx.globalAlpha = 0.12 * (1 - dist / (Math.min(w, h) * 0.42));
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
      ctx.restore();

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [seed, routeKey]);

  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,136,0.10),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,215,0,0.06),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(0,204,255,0.08),transparent_45%)]" />
    </div>
  );
}
