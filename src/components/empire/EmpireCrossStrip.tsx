import { motion } from "framer-motion";
import { EMPIRE_ORIGINS } from "@/config/empire";

const LINKS = [
  { label: "Citadel hub", href: `${EMPIRE_ORIGINS.citadel}/?utm_source=referrals&utm_medium=strip` },
  { label: "USA wire", href: `${EMPIRE_ORIGINS.usa}/?utm_source=referrals&utm_medium=strip` },
  { label: "TMACK48 media", href: `${EMPIRE_ORIGINS.media}/?utm_source=referrals&utm_medium=strip` },
  { label: "Empire feed", href: `${EMPIRE_ORIGINS.citadel}/feed?utm_source=referrals&utm_medium=strip` },
];

export function EmpireCrossStrip() {
  return (
    <div className="border-b border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[0.25em] text-neon/90">
        <span className="text-white/45">Empire mesh</span>
        {LINKS.map((l) => (
          <motion.a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -1 }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80 hover:border-neon/40"
          >
            {l.label}
          </motion.a>
        ))}
      </div>
    </div>
  );
}
