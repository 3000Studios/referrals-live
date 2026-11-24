import clsx from "clsx";
import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

type Tone = "neon" | "gold" | "electric";

type Props = {
  children: ReactNode;
  className?: string;
  /** Accent used for the spotlight, the spinning edge and the tap burst. */
  tone?: Tone;
  /** Max tilt in degrees. */
  tilt?: number;
};

const TONES: Record<Tone, { spot: string; burst: string; shadow: string }> = {
  neon: { spot: "52,211,153", burst: "#34d399", shadow: "rgba(52,211,153,0.32)" },
  gold: { spot: "251,191,36", burst: "#fbbf24", shadow: "rgba(251,191,36,0.32)" },
  electric: { spot: "34,211,238", burst: "#22d3ee", shadow: "rgba(34,211,238,0.32)" },
};

type Burst = { id: number; x: number; y: number };

/**
 * Interactive card surface.
 *
 * Hover (mouse/pen): the card lifts and tilts toward the pointer, a
 * spotlight follows it, a light sweep crosses the face and a gradient edge
 * spins around the border.
 * Tap or click (any pointer, so phones get it too): a shock ring and sparks
 * burst from the touch point and the edge lights up for a moment.
 * Keyboard focus inside the card lights the edge. Reduced-motion users get
 * a static highlight with no tilt, sweep or burst.
 */
export function TiltCard({ children, className, tone = "neon", tilt = 10 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const colors = TONES[tone];

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 170, damping: 18, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 170, damping: 18, mass: 0.6 });
  const rotateX = useTransform(smy, [0, 1], [tilt, -tilt]);
  const rotateY = useTransform(smx, [0, 1], [-tilt * 1.2, tilt * 1.2]);
  const px = useTransform(smx, (v) => `${v * 100}%`);
  const py = useTransform(smy, (v) => `${v * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(620px circle at ${px} ${py}, rgba(${colors.spot},0.18), rgba(${colors.spot},0.05) 42%, transparent 66%)`;
  const specular = useMotionTemplate`radial-gradient(260px circle at ${px} ${py}, rgba(255,255,255,0.10), transparent 70%)`;

  const [bursts, setBursts] = useState<Burst[]>([]);
  const [active, setActive] = useState(false);
  const activeTimer = useRef<number | undefined>(undefined);

  const place = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      mx.set(Math.min(1, Math.max(0, x)));
      my.set(Math.min(1, Math.max(0, y)));
      return { x: clientX - r.left, y: clientY - r.top };
    },
    [mx, my],
  );

  return (
    <motion.div
      ref={ref}
      className={clsx("fx-card relative overflow-hidden rounded-3xl", active && "is-active", className)}
      data-tone={tone}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        place(e.clientX, e.clientY);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      onPointerDown={(e) => {
        const at = place(e.clientX, e.clientY);
        setActive(true);
        window.clearTimeout(activeTimer.current);
        activeTimer.current = window.setTimeout(() => setActive(false), 950);
        if (reduce || !at) return;
        const id = Date.now() + Math.random();
        setBursts((b) => [...b.slice(-3), { id, x: at.x, y: at.y }]);
        window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 800);
      }}
      whileHover={reduce ? undefined : { scale: 1.03, y: -6 }}
      whileTap={reduce ? undefined : { scale: 0.975 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        transformPerspective: 900,
        transformStyle: "preserve-3d",
        rotateX: reduce ? 0 : rotateX,
        rotateY: reduce ? 0 : rotateY,
        backgroundImage: spotlight,
        ["--fx-shadow" as string]: colors.shadow,
      }}
    >
      {/* Cursor-tracking specular highlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: specular }}
      />
      {/* Light sweep and spinning gradient edge (CSS in index.css) */}
      <div aria-hidden className="fx-shine" />
      <div aria-hidden className="fx-ring" />

      {/* Tap burst: shock ring plus sparks from the touch point */}
      <AnimatePresence>
        {bursts.map((b) => (
          <span
            key={b.id}
            aria-hidden
            className="pointer-events-none absolute z-[4]"
            style={{ left: b.x, top: b.y }}
          >
            <motion.span
              className="absolute -left-6 -top-6 block h-12 w-12 rounded-full"
              style={{ border: `2px solid ${colors.burst}`, boxShadow: `0 0 18px ${colors.burst}` }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              const dist = 46 + (i % 3) * 14;
              return (
                <motion.span
                  key={i}
                  className="absolute -left-1 -top-1 block h-2 w-2 rounded-full"
                  style={{ background: colors.burst, boxShadow: `0 0 10px ${colors.burst}` }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 0.2, opacity: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
          </span>
        ))}
      </AnimatePresence>

      <div className="relative z-[1] h-full">{children}</div>
    </motion.div>
  );
}
