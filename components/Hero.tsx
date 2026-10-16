"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./Hero.module.css";

/**
 * Hero artboard = Figma frame area below the header (1728 × 961 design px; frame y − 131).
 * Positions are Figma render bounds so each layer lands exactly where it sits in the frame.
 * Paint order matches Figma: small tomato → right tomato → Open sign → title → tagline → left tomato.
 *
 * Load sequence: the Open sign drops in big at the centre, swings, and falls away; then the
 * tomatoes drop in largest → smallest, then the title + tagline (then the navbar and cue).
 */
const tomatoes = {
  small: { src: "/home/tomato-small.webp", w: 1243, h: 1290, x: 948.68, y: 87.74, dw: 621.5, dh: 645, opacity: 0.7, order: 2 },
  right: { src: "/home/tomato-right.webp", w: 1239, h: 1347, x: 1108.82, y: 299.84, dw: 619.5, dh: 673.5, opacity: 1, order: 1 },
  left: { src: "/home/tomato-left-v2.webp", w: 1392, h: 1697, x: 0, y: 192.44, dw: 696, dh: 848.5, opacity: 1, order: 0 },
};

export const taglines = [
  "Research-driven",
  "Consumer-focused",
  "Visually expressive",
  "Startup trained",
  "Versatile",
  "Brand minded",
  "Culturally fluent",
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

  // The sign's intro happens big and centred: measure its resting box, and hand CSS the offset +
  // scale that put its pivot in the middle of the screen at ~60% of the viewport.
  const signRef = useRef<HTMLDivElement>(null);
  const [introRunning, setIntroRunning] = useState(false);
  const started = useRef(false);
  const start = () => {
    if (started.current) return;
    started.current = true;
    const el = signRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min((vw * 0.6) / r.width, (vh * 0.6) / r.height);
      const pivotX = r.left + r.width * 0.471;
      const pivotY = r.top + r.height * 0.006;
      el.style.setProperty("--is", String(scale));
      el.style.setProperty("--ix", `${vw / 2 - pivotX}px`);
      el.style.setProperty("--iy", `${vh / 2 - (r.height * scale) / 2 - pivotY}px`);
    }
    setReady(true);
    // lift the hero above the page while the big sign is on screen, then drop it back
    setIntroRunning(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        setIntroRunning(false);
        document.documentElement.dataset.intro = "done"; // reveals the rest of the page
      },
      reduce ? 0 : 2600,
    );
  };

  // Start once the tomato images are in (so they don't pop in mid-animation); never wait > 1.6s.
  useEffect(() => {
    if (loaded >= total) start();
  }, [loaded, total]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = window.setTimeout(start, 1600);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Start cycling the pill after it has animated in.
  useEffect(() => {
    if (!ready) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setPillActive(true), reduce ? 1000 : 4800);
    return () => window.clearTimeout(t);
  }, [ready]);

  // Let the header know the intro has started, so it can slide in after the hero has landed.
  useEffect(() => {
    if (ready) window.dispatchEvent(new Event("hero:intro"));
  }, [ready]);

  const onLoad = () => setLoaded((n) => n + 1);

  return (
    <section
      className={`${styles.hero} ${ready ? styles.play : ""} ${introRunning ? styles.introRunning : ""}`}
      aria-label="Intro"
    >
      <noscript>
        <style>{`.${styles.hero} .${styles.layer}{opacity:1!important;animation:none!important}#seasonal-picks,.page-after-hero{opacity:1!important}`}</style>
      </noscript>
      <div className={styles.canvas}>
        <Tomato id="small" onLoad={onLoad} />
        <Tomato id="right" onLoad={onLoad} />

        <div ref={signRef} className={`${styles.layer} ${styles.sign}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/open-sign.png" alt="" width={768} height={696} />
        </div>

        <h1 className={`${styles.layer} ${styles.name}`}>
          hope<span className={styles.apostrophe}>’</span>s grocer
          <span className="visually-hidden"> — the portfolio of Matthew Hope, product designer</span>
        </h1>
        <p className={`${styles.layer} ${styles.tagline}`}>
          <span className={styles.lead}>Matthew is</span>
          <span className="visually-hidden"> {taglines.join(", ").toLowerCase()}</span>
          <RotatingPill active={pillActive} />
        </p>

        <Tomato id="left" onLoad={onLoad} />
      </div>

      {/* Figma "start shopping" cue — pinned to the bottom of the screen, scrolls to the projects */}
      <a href="#seasonal-picks" className={styles.cue}>
        <span>start shopping</span>
        <svg className={styles.cueArrow} width="25" height="14" viewBox="0 0 25 14" fill="none" aria-hidden="true">
          <path d="M0.707092 0.721985L12.2071 12.222L24.2071 0.721985" stroke="currentColor" strokeWidth="2" />
        </svg>
      </a>
    </section>
  );
}
