import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function MouseTrail() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 28 });
  const sy = useSpring(y, { stiffness: 280, damping: 28 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-neon/12 via-electric/6 to-transparent opacity-60 blur-3xl"
      style={{ x: sx, y: sy }}
    />
  );
}
