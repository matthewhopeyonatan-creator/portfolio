"use client";

import { useEffect, useState } from "react";
import styles from "./FlapWord.module.css";

/**
 * Figma 538:1620 — a small bracketed word at the top right of the name, changing like an old
 * split-flap departures board: every few seconds each letter clacks through a couple of flaps to
 * the next word, one letter just after another, left to right. Decorative (aria-hidden).
 */
const WORDS = ["visual", "0 to 1", "versatile", "agile", "consumer"];
const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789";
const HOLD = 2600; // ms each word stays up

// two in-between flaps per letter, picked from the letters themselves so it reads as a board
const flap = (seed: number) => GLYPHS[(seed * 7 + 11) % GLYPHS.length];

export default function FlapWord({ startIn, className = "" }: { startIn: number; className?: string }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        setI((n) => {
          setPrev(WORDS[n % WORDS.length]);
          return n + 1;
        });
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
        const strip = prev === null ? [ch] : [from, flap(i * 13 + k), flap(i * 5 + k * 3 + 1), ch];
        return (
          <span key={k} className={styles.cell} style={{ "--k": k } as React.CSSProperties}>
            {/* the letter it lands on sizes the cell; the strip of flaps runs inside it */}
            <span className={styles.sizer}>{ch === " " ? " " : ch}</span>
            <span key={i} className={`${styles.strip} ${prev === null ? "" : styles.flip}`}>
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
