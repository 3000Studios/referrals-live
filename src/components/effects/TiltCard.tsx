import clsx from "clsx";
import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

type Props = { children: ReactNode; className?: string };

export function TiltCard({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 140, damping: 22 });
  const smy = useSpring(my, { stiffness: 140, damping: 22 });

  // Position spotlight as percentage strings for CSS calc
  const spotX = useMotionTemplate`${smx}`;
  const spotY = useMotionTemplate`${smy}`;
  const bg = useMotionTemplate`radial-gradient(800px circle at calc(${spotX} * 100%) calc(${spotY} * 100%), rgba(52,211,153,0.14), rgba(5,150,105,0.06) 40%, transparent 65%)`;

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
      whileHover={{ rotateX: 6, rotateY: -6, scale: 1.025, z: 20 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
      style={{
        transformPerspective: 800,
        transformStyle: "preserve-3d",
        backgroundImage: bg,
      }}
    >
      {/* Specular highlight that tracks cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at calc(${spotX} * 100%) calc(${spotY} * 100%), rgba(255,255,255,0.04), transparent 70%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
