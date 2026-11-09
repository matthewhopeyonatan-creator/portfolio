"use client";

import { useEffect, useState } from "react";
import { prepareTheme, setTheme, useTheme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

/**
 * The light / dark switch as the shop's hanging sign (Figma 21:160 Open, 483:4699 Closed): Open
 * on one side, Closed on the back, both hung from the same nail. A click turns the sign round on
 * its string, like a shopkeeper closing up (or opening again), and switches the theme.
 * Sized in --s (1 Figma px).
 */

/** the sign's string up to the nail (Figma "Vector 3147"), in the ink so it shows in both themes */
const String_ = ({ d, w, h }: { d: string; w: number; h: number }) => (
  <svg className={styles.string} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  // half-turns so far: even shows Open, odd shows Closed. It only ever counts up, so the sign
  // always turns the same way round, as a hand would.
  const [turns, setTurns] = useState(dark ? 1 : 0);
  // no turning on the first paint (arriving on a page already dark just shows Closed)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTurns((t) => (t % 2 === 1) === dark ? t : t + 1);
  }, [dark]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      className={`${styles.toggle} ${ready ? styles.ready : ""} ${className}`}
      onPointerEnter={prepareTheme}
      onPointerDown={prepareTheme}
      onFocus={prepareTheme}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className={styles.swing}>
        <span className={styles.card} style={{ transform: `rotateY(${turns * 180}deg)` }}>
          <span className={`${styles.face} ${styles.open}`} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/sign-open.svg" alt="" width={169} height={129} draggable={false} />
            <String_ d="M19 52.7244L71 1.22437L140 37.2244" w={169} h={129} />
            <span className={styles.hint}>tap to close</span>
          </span>
          <span className={`${styles.face} ${styles.closed}`} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/sign-closed.svg" alt="" width={221} height={144} draggable={false} />
            <String_ d="M38.5 68.7439L120 1.2439L175 37.7439" w={221} h={144} />
            <span className={styles.hint}>tap to open</span>
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
