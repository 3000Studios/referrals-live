import clsx from "clsx";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/browse", label: "Browse" },
  { to: "/categories", label: "Categories" },
  { to: "/submit", label: "Submit" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/games", label: "Games" },
  { to: "/blog", label: "Blog" },
  { to: "/premium", label: "Premium" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 120], ["rgba(5, 5, 8, 0.55)", "rgba(5, 5, 8, 0.94)"]);
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      style={{ backgroundColor: headerBg }}
      className={clsx("fixed inset-x-0 top-0 z-50 border-b border-white/10 backdrop-blur-xl transition-colors")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
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
          <Link
            to="/login"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:border-neon/40"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-gradient-to-r from-neon to-emerald-400 px-4 py-2 text-sm font-semibold text-black shadow-neon"
          >
            Join
          </Link>
        </div>

        <button
          type="button"
          className="relative z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 lg:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Toggle menu</span>
          <div className="flex w-6 flex-col gap-1.5">
            <motion.span
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="h-0.5 w-full bg-white"
            />
            <motion.span
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              className="h-0.5 w-full bg-white"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="h-0.5 w-full bg-white"
            />
          </div>
        </button>
      </div>

      {open ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-white/10 bg-void/95 lg:hidden"
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/5 px-3 py-3 text-sm font-semibold text-white/90"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-neon/30 px-3 py-3 text-sm font-semibold text-neon"
            >
              Dashboard
            </Link>
            <div className="mt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-center text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-neon py-3 text-center text-sm font-semibold text-black"
              >
                Join
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.header>
  );
}
