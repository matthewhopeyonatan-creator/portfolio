"use client";

import { useEffect, useState } from "react";
import styles from "./FlapWord.module.css";

/**
 * Figma 538:1620 — a small bracketed word at the top right of the name that keeps changing: every
 * few seconds the tag's letters (brackets too) rise up and fade out one after another, left to
 * right, while the next one's come up from below into place the same way, overlapping, so there's
 * no pause and nothing jumps. Letters are never cut. The first word rises in the moment the name
 * appears. Decorative (aria-hidden).
 */
const WORDS = ["creative", "dancer", "hiker", "cook", "friend", "designer"];
const HOLD = 2600; // ms each word stays up

const Letters = ({ text, className }: { text: string; className: string }) => (
  <span className={className}>
    {[...text].map((ch, k) => (
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

  // once the old tag is out, let it go
  useEffect(() => {
    if (!prev) return;
    const t = window.setTimeout(() => setPrev(null), 480 + (prev.length + 2) * 40 + 60);
    return () => window.clearTimeout(t);
  }, [prev, run]);

  const word = WORDS[i % WORDS.length];
  return (
    <span className={`${styles.flapWord} ${className}`} aria-hidden="true">
      <span className={styles.window}>
        {prev ? <Letters key={`out${run}`} text={`[${prev}]`} className={`${styles.word} ${styles.out}`} /> : null}
        <Letters key={`in${run}`} text={`[${word}]`} className={`${styles.word} ${run ? styles.in : ""}`} />
      </span>
    </span>
  );
}
