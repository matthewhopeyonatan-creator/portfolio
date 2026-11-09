"use client";

import { useEffect, useRef, useState } from "react";
import { prepareTheme, setTheme, useTheme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

/**
 * The light / dark switch as the shop's hanging sign (Figma 21:160 Open, 483:4699 Closed, set
 * straight): Open on one side, Closed on the back, hung from one nail. A click flips it round on
 * its string the way a real one goes: a quick spin, past where it's going, a couple of smaller
 * swings back and forth, then still — with a slight sway on the nail while it's moving.
 * Sized in --s (1 Figma px).
 */

// the turn is a damped spring (mass 1, stiffness 100, damping 10): ~29° past on the first swing,
// ~5° back on the next, still within about a second
const K = 100;
const C = 10;
const W = Math.sqrt(K); // natural frequency
const Z = C / (2 * W); // damping ratio, 0.5
const WD = W * Math.sqrt(1 - Z * Z);
const SWAY = 0.003; // degrees of sway on the nail per degree/second of turn (peaks around 3°)
const STEP = 1 / 60;

type Spin = { from: number; to: number; v0: number; t0: number };

/** angle and angular velocity (deg, deg/s) of a spin, t seconds in */
function at(s: Spin, t: number) {
  const a = s.from - s.to;
  const b = (s.v0 + Z * W * a) / WD;
  const e = Math.exp(-Z * W * t);
  const cos = Math.cos(WD * t);
  const sin = Math.sin(WD * t);
  return {
    x: s.to + e * (a * cos + b * sin),
    v: e * ((b * WD - Z * W * a) * cos - (a * WD + Z * W * b) * sin),
  };
}

const pose = (x: number, v: number) => `rotate(${(-v * SWAY).toFixed(3)}deg) rotateY(${x.toFixed(3)}deg)`;

/** the sign's string up to the nail, in the ink so it shows on both pages */
const String_ = ({ d, w, h }: { d: string; w: number; h: number }) => (
  <svg className={styles.string} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  const card = useRef<HTMLSpanElement>(null);
  // half-turns so far: even shows Open, odd shows Closed. It only counts up, so the sign always
  // turns the same way round, as a hand would.
  const turns = useRef(dark ? 1 : 0);
  const spin = useRef<Spin | null>(null);
  const anim = useRef<Animation | null>(null);
  const [initial] = useState(() => (dark ? 180 : 0));

  useEffect(() => {
    const el = card.current;
    if (!el || (turns.current % 2 === 1) === dark) return;
    turns.current += 1;
    const to = turns.current * 180;
    el.style.transform = pose(to, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // CSS crossfades

    // pick up from wherever the sign is, mid-swing included
    const now = performance.now() / 1000;
    const cur = spin.current ? at(spin.current, now - spin.current.t0) : { x: to - 180, v: 0 };
    anim.current?.cancel();
    const s: Spin = { from: cur.x, to, v0: cur.v, t0: now };
    spin.current = s;

    const frames: Keyframe[] = [];
    let t = 0;
    for (;;) {
      const { x, v } = at(s, t);
      frames.push({ transform: pose(x, v) });
      if (t > 0.3 && Math.abs(x - to) < 0.2 && Math.abs(v) < 4) break;
      t += STEP;
    }
    frames.push({ transform: pose(to, 0) });
    anim.current = el.animate(frames, { duration: t * 1000, easing: "linear" });
    anim.current.onfinish = () => {
      if (spin.current === s) spin.current = null;
    };
  }, [dark]);

  useEffect(() => () => anim.current?.cancel(), []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      className={`${styles.toggle} ${className}`}
      onPointerEnter={prepareTheme}
      onPointerDown={prepareTheme}
      onFocus={prepareTheme}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className={styles.swing}>
        <span ref={card} className={styles.card} style={{ transform: pose(initial, 0) }}>
          <span className={`${styles.face} ${styles.open}`} aria-hidden="true">
            <String_ d="M25 51L79 1L110 58" w={158} h={121.89} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/sign-open-straight.svg" alt="" width={158} height={76} draggable={false} />
          </span>
          <span className={`${styles.face} ${styles.closed}`} aria-hidden="true">
            <String_ d="M44 51L107.35 1L160 57" w={214.7} h={126.29} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/sign-closed-straight.svg" alt="" width={215} height={80} draggable={false} />
          </span>
        </span>
      </span>
    </button>
  );
}

/** the switch on the other pages: top right, a margin under the navbar */
export function PageThemeToggle() {
  return (
    <div className={styles.pageRow}>
      <ThemeToggle className={styles.onPage} />
    </div>
  );
}
