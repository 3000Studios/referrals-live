import clsx from "clsx";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

const links = [
  { to: "/browse", label: "Browse" },
  { to: "/categories", label: "Categories" },
  { to: "/submit", label: "Submit" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/blog", label: "Blog" },
  { to: "/premium", label: "Premium" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], ["rgba(5, 5, 8, 0.55)", "rgba(5, 5, 8, 0.94)"]);
  const [open, setOpen] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.25 });
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const wireNodes = useMemo(
    () => [
      { x: 4, y: 28 },
      { x: 18, y: 8 },
      { x: 34, y: 24 },
      { x: 50, y: 6 },
      { x: 66, y: 24 },
      { x: 82, y: 10 },
      { x: 96, y: 28 },
    ],
    [],
  );

  const updatePointer = (clientX: number, clientY: number, rect: DOMRect) => {
    const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setPointer({ x: nx, y: ny });
  };

  return (
    <motion.header
      style={{ backgroundColor: headerBg }}
      className={clsx("sticky inset-x-0 top-12 z-50 border-b border-white/10 backdrop-blur-xl transition-colors")}
      onMouseMove={(e) => updatePointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (!t) return;
        updatePointer(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={() => setPointer({ x: 0.5, y: 0.25 })}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 overflow-hidden opacity-85">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(120,80,255,0.35)" />
              <stop offset="50%" stopColor="rgba(0,204,255,0.35)" />
              <stop offset="100%" stopColor="rgba(0,255,136,0.35)" />
            </linearGradient>
          </defs>
          {wireNodes.map((node, idx) => {
            if (idx === wireNodes.length - 1) return null;
            const next = wireNodes[idx + 1];
            const shiftX = (pointer.x - 0.5) * (idx % 2 === 0 ? 6 : -6);
            const shiftY = (pointer.y - 0.2) * (idx % 2 === 0 ? -8 : 8);
            return (
              <line
                key={`line-${idx}`}
                x1={node.x + shiftX}
                y1={node.y + shiftY}
                x2={next.x + shiftX * 0.8}
                y2={next.y + shiftY * 0.8}
                stroke="url(#wireGrad)"
                strokeWidth="0.6"
              />
            );
          })}
          {wireNodes.map((node, idx) => {
            const pullX = (pointer.x - 0.5) * (idx % 2 === 0 ? 8 : -8);
            const pullY = (pointer.y - 0.2) * (idx % 2 === 0 ? -10 : 10);
            return (
              <circle
                key={`node-${idx}`}
                cx={node.x + pullX}
                cy={node.y + pullY}
                r="1.2"
                fill={idx % 2 === 0 ? "rgba(0,255,136,0.45)" : "rgba(128,94,255,0.45)"}
              />
            );
          })}
        </svg>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="logo-animated font-display text-xl font-extrabold tracking-tight text-white">
            referrals<span className="text-neon">.live</span>
          </span>
          <span className="hidden rounded-full border border-neon/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neon/90 sm:inline">
            marketplace
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                clsx(
                  "text-sm font-semibold transition",
                  isActive ? "text-neon" : "text-white/70 hover:text-white",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:border-neon/40"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => logout().catch(() => null)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:border-neon/40"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:border-neon/40"
              >
                Login
              </Link>
              <Link
                to="/register?mode=username"
                className="rounded-full bg-gradient-to-r from-neon to-emerald-400 px-4 py-2 text-sm font-semibold text-black shadow-neon"
              >
                Claim username
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="relative z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] lg:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Toggle menu</span>
          <div className="flex w-6 flex-col gap-1.5">
            <motion.span
              animate={open ? { rotate: 45, y: 6, scaleX: 1.05 } : { rotate: 0, y: 0, scaleX: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="h-0.5 w-full bg-white"
            />
            <motion.span
              animate={open ? { opacity: 0, x: 10 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-0.5 w-full bg-white"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -6, scaleX: 1.05 } : { rotate: 0, y: 0, scaleX: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="h-0.5 w-full bg-white"
            />
          </div>
        </button>
      </div>

      {open ? (
        <motion.div
          initial={{ height: 0, opacity: 0, y: -8 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="border-t border-white/10 bg-void/95 lg:hidden"
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            {links.map((l) => (
              <motion.div key={l.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/5 px-3 py-3 text-sm font-semibold text-white/90"
              >
                {l.label}
                </Link>
              </motion.div>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-neon/30 px-3 py-3 text-sm font-semibold text-neon"
            >
              Dashboard
            </Link>
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 py-3 text-center text-sm font-semibold"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout().catch(() => null);
                      setOpen(false);
                    }}
                    className="flex-1 rounded-xl bg-neon py-3 text-center text-sm font-semibold text-black"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 py-3 text-center text-sm font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register?mode=username"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl bg-neon py-3 text-center text-sm font-semibold text-black"
                  >
                    Claim username
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.header>
  );
}
