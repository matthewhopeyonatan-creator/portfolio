"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./Hero.module.css";

/**
 * Hero artboard = Figma frame area below the header (1728 × 961 design px; frame y − 131).
 * Positions are Figma render bounds so each layer lands exactly where it sits in the frame.
 * Paint order matches Figma: small tomato → right tomato → Open sign → title → tagline → left tomato.
 *
 * Load sequence: tomatoes drop in largest → smallest, then the title + tagline, then the Open sign
 * swings in last.
 */
const tomatoes = {
  small: { src: "/home/tomato-small.webp", w: 1243, h: 1290, x: 948.68, y: 87.74, dw: 621.5, dh: 645, opacity: 0.7, order: 2 },
  right: { src: "/home/tomato-right.webp", w: 1239, h: 1347, x: 1108.82, y: 299.84, dw: 619.5, dh: 673.5, opacity: 1, order: 1 },
  left: { src: "/home/tomato-left-v2.webp", w: 1392, h: 1697, x: 0, y: 192.44, dw: 696, dh: 848.5, opacity: 1, order: 0 },
};

export const taglines = [
  "Science backed",
  "Consumer products",
  "Visual storyteller",
  "Fast learner",
  "Versatile",
];

type TomatoKey = keyof typeof tomatoes;

function Tomato({ id, onLoad }: { id: TomatoKey; onLoad: () => void }) {
  const t = tomatoes[id];
  return (
    <div
      className={`${styles.layer} ${styles.tomato}`}
      style={
        {
          "--x": t.x,
          "--y": t.y,
          "--w": t.dw,
          "--h": t.dh,
          "--o": t.opacity,
          "--i": t.order,
        } as React.CSSProperties
      }
    >
      <Image src={t.src} alt="" width={t.w} height={t.h} priority sizes="42vw" onLoad={onLoad} />
    </div>
  );
}

/** Pill that cycles through the taglines every second: words roll upward, width eases to fit. */
function RotatingPill({ active }: { active: boolean }) {
  const [{ index, prev }, setWords] = useState<{ index: number; prev: number | null }>({
    index: 0,
    prev: null,
  });
  const [width, setWidth] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(
      () => setWords((w) => ({ prev: w.index, index: (w.index + 1) % taglines.length })),
      1000,
    );
    return () => window.clearInterval(id);
  }, [active]);

  useLayoutEffect(() => {
    const measure = () => measureRef.current && setWidth(measureRef.current.offsetWidth);
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  return (
    <span className={styles.pill} aria-hidden="true">
      <span className={styles.pillWindow} style={{ width }}>
        {prev !== null && (
          <span key={`out-${index}`} className={styles.pillWordOut}>
            {taglines[prev]}
          </span>
        )}
        <span key={`in-${index}`} className={styles.pillWord}>
          {taglines[index]}
        </span>
      </span>
      <span ref={measureRef} className={styles.pillMeasure}>
        {taglines[index]}
      </span>
    </span>
  );
}

export default function Hero() {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [pillActive, setPillActive] = useState(false);
  const total = Object.keys(tomatoes).length;

  // Start once the tomato images are in (so they don't pop in mid-animation); never wait > 1.6s.
  useEffect(() => {
    if (loaded >= total) setReady(true);
  }, [loaded, total]);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1600);
    return () => window.clearTimeout(t);
  }, []);
  // Start cycling the pill after it has animated in.
  useEffect(() => {
    if (!ready) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setPillActive(true), reduce ? 1000 : 2600);
    return () => window.clearTimeout(t);
  }, [ready]);

  // Let the header know the intro has started, so it can slide in after the hero has landed.
  useEffect(() => {
    if (ready) window.dispatchEvent(new Event("hero:intro"));
  }, [ready]);

  const onLoad = () => setLoaded((n) => n + 1);

  return (
    <section className={`${styles.hero} ${ready ? styles.play : ""}`} aria-label="Intro">
      <noscript>
        <style>{`.${styles.hero} .${styles.layer}{opacity:1!important;animation:none!important}`}</style>
      </noscript>
      <div className={styles.canvas}>
        <Tomato id="small" onLoad={onLoad} />
        <Tomato id="right" onLoad={onLoad} />

        <div className={`${styles.layer} ${styles.sign}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/open-sign.png" alt="" width={768} height={696} />
        </div>

        <h1 className={`${styles.layer} ${styles.name}`}>
          Hope<span className={styles.apostrophe}>’</span>s Grocer
          <span className="visually-hidden"> — the portfolio of Matthew Hope, product designer</span>
        </h1>
        <p className={`${styles.layer} ${styles.tagline}`}>
          <span className={styles.lead}>Matthew is</span>
          <span className="visually-hidden"> {taglines.join(", ").toLowerCase()}</span>
          <RotatingPill active={pillActive} />
        </p>

        <Tomato id="left" onLoad={onLoad} />
      </div>
    </section>
  );
}
