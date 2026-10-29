"use client";

import { useEffect, useRef } from "react";
import styles from "./Tilt.module.css";

/**
 * A card that gives under the pointer: it tips a few degrees toward it, with a soft dent of shade
 * under the pointer, a light rim at its mirror, and a shadow thrown the other way. The frame never
 * moves (it's what the pointer is measured against, and it holds the perspective so the vanishing
 * point stays put); only the card turns. Everything is written straight to the elements each frame
 * and eased toward the pointer, so it trails a touch rather than snapping. Mouse only; off for
 * reduced motion. No will-change — the browser promotes the card itself once it starts moving.
 */
export default function Tilt({
  children,
  className = "",
  max = 8, // degrees at the very edge
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const sheen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const f = frame.current;
    const c = card.current;
    const s = sheen.current;
    if (!f || !c || !s) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // pointer position across the card, -1 … 1; `on` is how present the effect is (0 at rest)
    const target = { x: 0, y: 0, on: 0 };
    const now = { x: 0, y: 0, on: 0 };
    let raf = 0;

    const paint = () => {
      const { x, y, on } = now;
      c.style.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
      // shading colours come from the theme (globals.css --tilt-*): a light page gets a soft ink
      // shadow and a bright rim, a dark one a shadow darker than the page and only a faint rim
      c.style.boxShadow = `${(-x * 24).toFixed(1)}px ${(20 - y * 16).toFixed(1)}px ${40 + on * 28}px color-mix(in srgb, var(--tilt-shadow) ${((0.08 + on * 0.14) * 250).toFixed(1)}%, transparent)`;
      const px = 50 + x * 50;
      const py = 50 + y * 50;
      s.style.opacity = on.toFixed(3);
      s.style.background =
        `radial-gradient(circle at ${px}% ${py}%, var(--tilt-dent), transparent 45%),` +
        `radial-gradient(circle at ${100 - px}% ${100 - py}%, var(--tilt-rim), transparent 45%)`;
    };

    const tick = () => {
      now.x += (target.x - now.x) * 0.14;
      now.y += (target.y - now.y) * 0.14;
      now.on += (target.on - now.on) * 0.12;
      paint();
      const settled =
        Math.abs(target.x - now.x) < 0.001 &&
        Math.abs(target.y - now.y) < 0.001 &&
        Math.abs(target.on - now.on) < 0.002;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // while something is pressed on the card (someone drawing on it), it lies flat and still, so
    // the paper doesn't swing out from under the pen
    let held = false;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("textarea, button, a")) return;
      held = true;
      cancelAnimationFrame(raf);
      raf = 0;
      target.x = target.y = target.on = 0;
      now.x = now.y = now.on = 0;
      paint();
    };
    const up = () => {
      held = false;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || held) return;
      const r = f.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      target.on = 1;
      kick();
    };
    const leave = () => {
      target.x = 0;
      target.y = 0;
      target.on = 0;
      kick();
    };

    paint();
    f.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    f.addEventListener("pointermove", move);
    f.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      f.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      f.removeEventListener("pointermove", move);
      f.removeEventListener("pointerleave", leave);
    };
  }, [max]);

  return (
    <div ref={frame} className={`${styles.frame} ${className}`}>
      <div ref={card} className={styles.card}>
        {children}
        <div ref={sheen} className={styles.sheen} aria-hidden="true" data-tilt-sheen />
      </div>
    </div>
  );
}
