"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./FlapWord.module.css";

/**
 * Figma 538:1620 — a small bracketed word at the top right of the name that keeps changing: every
 * few seconds the word's letters rise up and out one after another, left to right, while the next
 * word's letters come up from below into place, the same way. Letters fade as they move and are
 * never cut. The
 * first word rises in the moment the name appears. Decorative (aria-hidden).
 */
const WORDS = ["creative", "dancer", "hiker", "cook", "friend", "designer"];
const HOLD = 2600; // ms each word stays up

const Letters = ({ word, className }: { word: string; className: string }) => (
  <span className={className}>
    {[...word].map((ch, k) => (
      <span key={k} className={styles.letter} style={{ "--k": k } as React.CSSProperties}>
        {ch === " " ? " " : ch}
      </span>
    ))}
  </span>
);

export default function FlapWord({ startIn, className = "" }: { startIn: number; className?: string }) {
  // which word is up, the one leaving (null: none), and a counter that restarts the animation
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<string | null>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    const start = window.setTimeout(() => {
      setRun(1); // the first word rises in as the name appears
      timer = window.setInterval(() => {
        setI((n) => {
          setPrev(WORDS[n % WORDS.length]);
          return n + 1;
        });
        setRun((r) => r + 1);
      }, HOLD);
    }, startIn);
    return () => {
      window.clearTimeout(start);
      if (timer) window.clearInterval(timer);
    };
  }, [startIn]);

  // once the old word is out, let it go
  useEffect(() => {
    if (!prev) return;
    const t = window.setTimeout(() => setPrev(null), 480 + prev.length * 40 + 60);
    return () => window.clearTimeout(t);
  }, [prev, run]);

  // the window is as wide as the incoming word; the closing bracket travels from where the old
  // word ended to where the new one ends in step with the new letters rising in (same delay,
  // same length, same curve), so it widens or narrows with the word rather than jumping
  const win = useRef<HTMLSpanElement>(null);
  const close = useRef<HTMLSpanElement>(null);
  const lastW = useRef<number | null>(null);
  const word = WORDS[i % WORDS.length];
  useLayoutEffect(() => {
    const w = win.current?.getBoundingClientRect().width ?? 0;
    const was = lastW.current;
    lastW.current = w;
    if (was === null || Math.abs(was - w) < 0.5 || !close.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    close.current.animate([{ transform: `translateX(${was - w}px)` }, { transform: "none" }], {
      delay: 120,
      duration: 560 + (word.length - 1) * 40,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)", // --ease-out, like the letters coming in
      fill: "backwards",
    });
  }, [run, word]);

  return (
    <span className={`${styles.flapWord} ${className}`} aria-hidden="true">
      [
      <span ref={win} className={styles.window}>
        {prev ? <Letters key={`out${run}`} word={prev} className={`${styles.word} ${styles.out}`} /> : null}
        <Letters key={`in${run}`} word={word} className={`${styles.word} ${run ? styles.in : ""}`} />
      </span>
      <span ref={close} className={styles.close}>
        ]
      </span>
    </span>
  );
}
