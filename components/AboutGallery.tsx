"use client";

import { useEffect, useRef } from "react";
import styles from "./About.module.css";

/**
 * "Hope's gallery" (Figma 217:352): seven 546 × 607 photos, 20 apart, running the full width.
 * The strip drifts right to left, slowly and forever (the set is drawn twice, so it wraps without
 * a seam). Anyone can take it over: drag it (mouse or finger), or scroll sideways over it with a
 * trackpad / shift-wheel. When let go it glides on with the throw, then eases back into its drift.
 * Ordinary up-and-down scrolling always moves the page, never the strip. Reduced motion: no drift
 * (it still moves under the visitor's own hand).
 */
const PHOTOS = [
  { src: "/about/gallery-1.webp", alt: "Snorkelling over a reef" },
  { src: "/about/gallery-2.webp", alt: "Looking out over a hazy city at sunset" },
  { src: "/about/gallery-3.webp", alt: "Skiing selfie on a snowy slope" },
  { src: "/about/gallery-4.webp", alt: "Friends in the sea with a surfboard" },
  { src: "/about/gallery-5.webp", alt: "Dancing on stage" },
  { src: "/about/gallery-6.webp", alt: "Red rock canyon on a hike" },
  { src: "/about/gallery-7.webp", alt: "Skateboarding selfie on a sunny street" },
];

const DRIFT = 34; // Figma px per second, right to left

export default function AboutGallery() {
  const strip = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = strip.current;
    const t = track.current;
    if (!s || !t) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = 0; // how far the strip has travelled left, px
    let v = 0; // extra speed from the visitor (px/s, + = left)
    let drift = reduce ? 0 : 1; // 0…1: how much of the auto drift is on
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let visible = true;
    let raf = 0;
    let prev = performance.now();

    const unit = () => window.innerWidth / 1728;
    const setWidth = () => t.scrollWidth / 2; // one copy of the set (incl. its trailing gap)

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!dragging) {
        x += (DRIFT * unit() * drift + v) * dt;
        v *= Math.pow(0.04, dt); // the throw dies away over about a second
        if (Math.abs(v) < 1) v = 0;
        if (!reduce) drift += (1 - drift) * Math.min(1, dt * 1.2); // ease back into the drift
      }
      const w = setWidth();
      if (w > 0) x = ((x % w) + w) % w;
      t.style.transform = `translate3d(${(-x).toFixed(2)}px, 0, 0)`;
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const run = () => {
      if (!raf) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // drag — mouse or finger; vertical swipes still scroll the page (touch-action: pan-y)
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      drift = 0;
      v = 0;
      lastX = e.clientX;
      lastT = e.timeStamp;
      s.setPointerCapture(e.pointerId);
      s.dataset.dragging = "";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dts = Math.max(1, e.timeStamp - lastT) / 1000;
      x -= dx;
      v = -dx / dts; // remembered for the throw
      lastX = e.clientX;
      lastT = e.timeStamp;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (e.timeStamp - lastT > 80) v = 0; // held still before letting go: no throw
      v = Math.max(-4000, Math.min(4000, v));
      delete s.dataset.dragging;
    };

    // sideways scrolling over the strip (trackpad, shift + wheel) moves it; up/down is the page's
    const wheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      x += dx;
      drift = 0;
    };

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) run();
    });
    io.observe(s);
    s.addEventListener("pointerdown", down);
    s.addEventListener("pointermove", move);
    s.addEventListener("pointerup", up);
    s.addEventListener("pointercancel", up);
    s.addEventListener("wheel", wheel, { passive: false });
    run();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      s.removeEventListener("pointerdown", down);
      s.removeEventListener("pointermove", move);
      s.removeEventListener("pointerup", up);
      s.removeEventListener("pointercancel", up);
      s.removeEventListener("wheel", wheel);
    };
  }, []);

  const set = (copy: number) =>
    PHOTOS.map((p, i) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${copy}-${i}`}
        className={styles.photo}
        src={p.src}
        alt={copy === 0 ? p.alt : ""}
        aria-hidden={copy === 0 ? undefined : true}
        width={546}
        height={607}
        draggable={false}
        decoding="async"
      />
    ));

  return (
    <div ref={strip} className={styles.gallery} aria-label="Photos of Matthew" role="region">
      <div ref={track} className={styles.track}>
        {set(0)}
        {set(1)}
      </div>
    </div>
  );
}
