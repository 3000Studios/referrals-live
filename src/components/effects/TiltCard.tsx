import clsx from "clsx";
import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

type Props = { children: ReactNode; className?: string };

export function TiltCard({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 120, damping: 18 });
  const smy = useSpring(my, { stiffness: 120, damping: 18 });
  const bg = useMotionTemplate`radial-gradient(600px circle at ${smx} ${smy}, rgba(0,255,136,0.18), transparent 55%)`;

  return (
    <motion.div
      ref={ref}
      className={clsx("relative overflow-hidden rounded-3xl", className)}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      whileHover={{ rotateX: 4, rotateY: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      style={{
        transformPerspective: 900,
        backgroundImage: bg,
      }}
    >
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
