"use client";

import { useEffect, useState } from "react";
import styles from "./FlapWord.module.css";

/**
 * Figma 538:1620 — a small bracketed word at the top right of the name, changing like an old
 * split-flap departures board: every few seconds each letter rolls up through a couple of letters
 * to the next word, one letter just after another, left to right. The first word rolls in the
 * moment the name appears. Decorative (aria-hidden).
 */
const WORDS = ["creative", "dancer", "hiker", "cook", "friend", "designer"];
const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789";
const HOLD = 2600; // ms each word stays up

// two in-between flaps per letter, picked from the letters themselves so it reads as a board
const flap = (seed: number) => GLYPHS[(seed * 7 + 11) % GLYPHS.length];

export default function FlapWord({ startIn, className = "" }: { startIn: number; className?: string }) {
  // which word is up, the one it's rolling from (null: nothing to roll yet), and a counter that
  // restarts the letters' animation on every change
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<string | null>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    const start = window.setTimeout(() => {
      // as the name appears, the first word rolls in from blank flaps
      setPrev("");
      setRun(1);
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

  const word = WORDS[i % WORDS.length];
  return (
    <span className={`${styles.flapWord} ${className}`} aria-hidden="true">
      [
      {[...word].map((ch, k) => {
        const from = prev?.[k] ?? " ";
        const strip = prev === null ? [ch] : [from, flap(run * 13 + k), flap(run * 5 + k * 3 + 1), ch];
        return (
          <span key={k} className={styles.cell} style={{ "--k": k } as React.CSSProperties}>
            {/* the letter it lands on sizes the cell; the strip of flaps runs inside it */}
            <span className={styles.sizer}>{ch === " " ? " " : ch}</span>
            <span key={run} className={`${styles.strip} ${prev === null ? "" : styles.flip}`}>
              {strip.map((c, j) => (
                <span key={j} className={styles.face}>
                  {c === " " ? " " : c}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      ]
    </span>
  );
}
