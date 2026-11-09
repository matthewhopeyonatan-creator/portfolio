"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CursorTag.module.css";

/**
 * "add to cart" (Figma 482:4673): a small tag that rides at the bottom right of the mouse pointer
 * while it's over anything that goes in the cart — a project's tray or a hero sticker (elements
 * marked data-cursor="cart"). It trails the pointer with a light lag and fades in / out. Mouse
 * only; touch screens never see it.
 */
const OFFSET_X = 14; // px right of the pointer's tip
const OFFSET_Y = 18; // px below it
const EASE = 0.25; // share of the gap to the pointer closed each frame

export default function CursorTag() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let shown = false;

    const write = () => {
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };
    const tick = () => {
      pos.x += (target.x - pos.x) * EASE;
      pos.y += (target.y - pos.y) * EASE;
      write();
      raf =
        Math.abs(target.x - pos.x) > 0.1 || Math.abs(target.y - pos.y) > 0.1
          ? requestAnimationFrame(tick)
          : 0;
    };
    const place = (cx: number, cy: number, jump: boolean) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let x = cx + OFFSET_X;
      let y = cy + OFFSET_Y;
      // near the window's right / bottom edge it moves to the other side of the pointer
      if (x + w > window.innerWidth - 8) x = cx - OFFSET_X - w;
      if (y + h > window.innerHeight - 8) y = cy - OFFSET_Y - h;
      target.x = x;
      target.y = y;
      if (jump || reduce) {
        cancelAnimationFrame(raf);
        raf = 0;
        pos.x = x;
        pos.y = y;
        write();
      } else if (!raf) raf = requestAnimationFrame(tick);
    };

    // after a click on a tray / sticker the tag stays away until the pointer has left it: the case
    // study (or sticker story) opening over it can still let moves through to the tray beneath
    let spent = false;
    const html = document.documentElement;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const hit = !!(e.target as Element | null)?.closest?.('[data-cursor="cart"]');
      if (!hit) spent = false;
      // never over an open case study or sticker story
      const covered = html.classList.contains("project-open") || html.classList.contains("modal-open");
      const over = hit && !spent && !covered;
      // a fresh appearance starts right at the pointer; after that it trails
      place(e.clientX, e.clientY, over && !shown);
      if (over !== shown) {
        shown = over;
        setOn(over);
      }
    };
    const hide = () => {
      shown = false;
      setOn(false);
    };
    const press = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.('[data-cursor="cart"]')) spent = true;
      hide();
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    // clicking opens the case study / sticker story over the page: get out of the way at once
    document.addEventListener("pointerdown", press, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", press);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, []);

  return (
    <div ref={ref} className={styles.wrap} aria-hidden="true">
      <span className={`${styles.tag} ${on ? styles.on : ""}`}>add to cart</span>
    </div>
  );
}
