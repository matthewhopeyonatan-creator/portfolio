"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import styles from "./SlideToCheckout.module.css";

/**
 * Slide to check out. An ink handle sits at the left of the cart's checkout box; drag it across.
 * The ground it has covered is the same ink as the handle, so it reads as one block stretching
 * out of its corner and wiping the label as it goes. Past ~85% (or a quick flick) it commits:
 * the ink fills the box, "checking out" appears, and onConfirm rings up the receipt. Short of that it springs
 * back. Keyboard: the handle is a button — Enter / Space checks out straight away.
 */
export default function SlideToCheckout({ onConfirm }: { onConfirm: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const [held, setHeld] = useState(false);
  const [done, setDone] = useState(false);
  const drag = useRef<{ startX: number; startT: number; max: number; from: number } | null>(null);

  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const travel = () => {
    const t = trackRef.current;
    const g = gripRef.current;
    return t && g ? t.clientWidth - g.offsetWidth - 8 : 0; // 4px pad each side
  };

  // the covered ground runs from the left pad to the handle's right edge
  const washW = useTransform(x, (v) => v + (gripRef.current?.offsetWidth ?? 0));
  // the label goes quiet as the ink comes for it
  const sayOpacity = useTransform(x, (v) => {
    const max = travel() || 1;
    return Math.max(0, 1 - (v / max) * 1.4);
  });

  const commit = useCallback(() => {
    const max = travel();
    setDone(true);
    const finish = () => {
      // let "checking out" land for a beat, then ring it up (the receipt page)
      window.setTimeout(onConfirm, reduce() ? 0 : 550);
      // and be ready again if anyone comes back to it
      window.setTimeout(() => {
        setDone(false);
        x.set(0);
      }, 1600);
    };
    if (reduce()) {
      x.set(max);
      finish();
    } else {
      animate(x, max, { type: "spring", duration: 0.35, bounce: 0 }).then(finish);
    }
  }, [onConfirm, x]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (done || e.button !== 0 || drag.current) return; // one pointer at a time
    const grip = gripRef.current;
    if (!grip || !grip.contains(e.target as Node)) return; // only the handle starts a drag
    trackRef.current?.setPointerCapture(e.pointerId);
    x.stop();
    drag.current = { startX: e.clientX, startT: performance.now(), max: travel(), from: x.get() };
    setHeld(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    let v = d.from + (e.clientX - d.startX);
    // rubber-band past either end instead of hitting a wall
    if (v < 0) v = -Math.sqrt(-v) * 2;
    if (v > d.max) v = d.max + Math.sqrt(v - d.max) * 2;
    x.set(v);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setHeld(false);
    trackRef.current?.releasePointerCapture(e.pointerId);
    const moved = e.clientX - d.startX;
    const velocity = moved / Math.max(1, performance.now() - d.startT); // px per ms
    if (x.get() >= d.max * 0.85 || (velocity > 0.6 && x.get() > d.max * 0.4)) {
      commit();
    } else if (reduce()) {
      x.set(0);
    } else {
      animate(x, 0, { type: "spring", duration: 0.5, bounce: 0.15 });
    }
  };

  return (
    <div className={styles.slide}>
      <div
        ref={trackRef}
        className={styles.track}
        data-held={held || undefined}
        data-done={done || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.span className={styles.say} style={{ opacity: sayOpacity }} aria-hidden="true">
          slide to checkout
        </motion.span>
        <motion.span className={styles.wash} style={{ width: washW }} aria-hidden="true" />
        <motion.button
          ref={gripRef}
          type="button"
          className={styles.grip}
          style={{ x }}
          aria-label="Check out — see your receipt"
          onClick={(e) => {
            // a real click (keyboard, or a tap with no drag) checks out straight away
            if (e.detail === 0 && !done) commit();
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !done) {
              e.preventDefault();
              commit();
            }
          }}
        >
          <ArrowRight aria-hidden="true" strokeWidth={2} absoluteStrokeWidth />
        </motion.button>
        <span className={styles.done} aria-live="polite">
          {done ? (
            <>
              <Check aria-hidden="true" strokeWidth={2} absoluteStrokeWidth />
              checking out
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}
