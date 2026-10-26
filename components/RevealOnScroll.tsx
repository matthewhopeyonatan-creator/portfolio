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
    // posters: the shutter starts rolling up just before the slot reaches the screen (while it's
    // still ~15% of a screen below), so even a fast scroll lands on a poster that's already rising
    const ioNow = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.revealed = "";
          ioNow.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px 15% 0px", threshold: 0 },
    );
    document
      .querySelectorAll('[data-reveal]:not([data-reveal="swipe"])')
      .forEach((el) => io.observe(el));
    document.querySelectorAll('[data-reveal="swipe"]').forEach((el) => ioNow.observe(el));
    return () => {
      io.disconnect();
      ioNow.disconnect();
    };
  }, []);
  return null;
}
