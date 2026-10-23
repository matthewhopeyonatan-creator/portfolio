"use client";

import { useEffect } from "react";

/**
 * Entrance animations for the homepage sections. Anything marked `data-reveal` starts hidden
 * (only once this script runs, so nothing stays invisible without JS) and plays its entrance the
 * first time it scrolls into view. `--i` on an element staggers it after its neighbours.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.revealed = "";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    const els = document.querySelectorAll("[data-reveal]");
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
