import { useEffect, useRef, useState } from "react";
import type { StockVideo } from "@/data/media";

/**
 * Poster-first hover video (REBUILD 2026-10-18).
 *
 * The video file is fetched ONLY on first intent — a mouse hover on
 * hover-capable devices, or scrolling into view on touch devices — so
 * cards cost zero video bandwidth until a visitor shows interest.
 * Respects prefers-reduced-motion (never autoplays) and pauses when the
 * pointer leaves or the card scrolls away.
 */
export function HoverVideo({ video, className = "", imgClassName = "" }: { video: StockVideo; className?: string; imgClassName?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Touch devices: play while scrolled into view.
  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: none)").matches) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        setActive(entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5));
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => null);
    } else {
      v.pause();
    }
  }, [active]);

  const hoverCapable = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => {
        if (!reduced && hoverCapable) setActive(true);
      }}
      onMouseLeave={() => {
        if (hoverCapable) setActive(false);
      }}
    >
      <img
        src={video.poster}
        alt=""
        aria-hidden
        className={`h-full w-full object-cover ${imgClassName}`}
        loading="lazy"
        decoding="async"
      />
      {active ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={video.src}
          poster={video.poster}
          muted
          loop
          playsInline
          autoPlay
          aria-hidden
        />
      ) : null}
    </div>
  );
}
