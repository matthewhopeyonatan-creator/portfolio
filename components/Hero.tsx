"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./Hero.module.css";

/**
 * Hero artboard = Figma frame area below the header (1728 × 961 design px; frame y − 131).
 * Positions are Figma render bounds so each layer lands exactly where it sits in the frame.
 * Paint order matches Figma: small → right → middle → left tomato, then the headline on top.
 *
 * Load sequence: the Open sign drops in big at the centre, swings, and falls away; then the
 * tomatoes drop in largest → smallest, then the headline lines rise in, then the navbar, the sticker peel hint and the cue.
 */
const tomatoes = {
  small: { src: "/home/tomato-small.webp", w: 1243, h: 1290, x: 1047.68, y: -20, /* Figma −145.26, lowered so the navbar never crops it */ dw: 621.5, dh: 645, opacity: 0.7, order: 3 },
  right: { src: "/home/tomato-right-base.webp", w: 1438, h: 1347, x: 1108.82, y: 145.84, dw: 719, dh: 673.5, opacity: 0.9, order: 2 },
  mid: { src: "/home/tomato-mid-base.webp", w: 1501, h: 1579, x: 644.75, y: 275.77, dw: 750.5, dh: 789.5, opacity: 1, order: 1 },
  left: { src: "/home/tomato-left-base.webp", w: 1782, h: 1697, x: -195, y: 136.44, /* Figma 246.44, raised so the Jakarta sticker stays on screen */ dw: 891, dh: 848.5, opacity: 1, order: 0 },
};

/**
 * Fruit stickers, positioned on their tomato (design px from the tomato image's top-left; Figma
 * render bounds). `peel` = how far the lower-right fold travels on hover, tuned per shape so it
 * cuts ~27px into each sticker.
 */
const stickers: Record<string, { src: string; w: number; h: number; x: number; y: number; peel: number; label: string }[]> = {
  left: [
    { src: "/home/sticker-crowdvolt.webp", w: 225.3, h: 192.3, x: 200, y: 258.56, peel: 106, label: "CrowdVolt #2627" },
    { src: "/home/sticker-jakarta.webp", w: 256.3, h: 250, x: 438, y: 463.77, peel: 154, label: "Born and raised Jakarta 0717" },
    { src: "/home/sticker-cornell.webp", w: 140, h: 176.7, x: 599, y: 377.56, peel: 57, label: "Cornell Agriculture #2025" },
  ],
  right: [
    { src: "/home/sticker-fatboy.webp", w: 213.5, h: 203.5, x: 314.18, y: 363.16, peel: 116, label: "Fatboy supperclub NYC" },
    { src: "/home/sticker-25madison.webp", w: 280.5, h: 280.5, x: 383.18, y: 213.16, peel: 175, label: "25madison design fellow" },
  ],
  mid: [{ src: "/home/sticker-nyu-2.webp", w: 223, h: 235, x: 397.07, y: 184.87, peel: 128, label: "NYU design YR 2027" }],
};

function Sticker({ s }: { s: (typeof stickers)["left"][number] }) {
  return (
    <div
      className={styles.sticker}
      title={s.label}
      style={{ "--sx": s.x, "--sy": s.y, "--sw": s.w, "--sh": s.h, "--pd": s.peel } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.stickerFace} src={s.src} alt="" draggable={false} />
      <span className={styles.stickerFlapWrap} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.stickerFlap} src={s.src} alt="" draggable={false} />
      </span>
    </div>
  );
}

// the headline's phrases, and which ones sit on each of its three lines (Figma line breaks)
const phrases = ["Consumer driven,", "research driven,", "visually expressive,", "startup trained,", "agile and versatile"];
const headlineLines = [[0, 1], [2, 3], [4]];

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
      <Image src={t.src} alt="" width={t.w} height={t.h} priority sizes="52vw" onLoad={onLoad} className={styles.tomatoImg} />
      {stickers[id]?.map((s) => <Sticker key={s.src} s={s} />)}
    </div>
  );
}

export default function Hero() {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
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
  // Headline: once its lines have risen in, the full-ink highlight steps through the phrases every 1s.
  const [activePhrase, setActivePhrase] = useState(0);
  useEffect(() => {
    if (!ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let interval = 0;
    const startAt = window.setTimeout(() => {
      interval = window.setInterval(() => setActivePhrase((i) => (i + 1) % phrases.length), 1000);
    }, 4200);
    return () => {
      window.clearTimeout(startAt);
      window.clearInterval(interval);
    };
  }, [ready]);

  // Let the header know the intro has started, so it can slide in after the hero has landed.
  useEffect(() => {
    if (ready) window.dispatchEvent(new Event("hero:intro"));
  }, [ready]);

  // Hide the "start shopping" cue whenever the Seasonal picks section is on screen.
  const [picksInView, setPicksInView] = useState(false);
  useEffect(() => {
    const picks = document.getElementById("seasonal-picks");
    if (!picks || !("IntersectionObserver" in window)) return;
    // the section starts right at the fold, so require it to come 10% into view first
    const io = new IntersectionObserver(([entry]) => setPicksInView(entry.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    io.observe(picks);
    return () => io.disconnect();
  }, []);

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
        <Tomato id="mid" onLoad={onLoad} />
        <Tomato id="left" onLoad={onLoad} />

        <div ref={signRef} className={`${styles.layer} ${styles.sign}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/open-sign.png" alt="" width={768} height={696} />
        </div>

      </div>

      <h1 className="visually-hidden">hope’s grocer — the portfolio of Matthew Hope, product designer</h1>
      {/* Figma 21:168 — 64px Regular, 60 leading. One phrase at a time is in full ink, the rest at 50%;
          the highlight moves on every 1s. */}
      <p className={styles.headline}>
        {headlineLines.map((line, li) => (
          <span key={li} className={styles.line}>
            {line.map((pi, j) => (
              <span key={pi} className={`${styles.phrase} ${pi === activePhrase ? styles.phraseOn : ""}`}>
                {phrases[pi]}
                {j < line.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        ))}
      </p>

      {/* Figma "start shopping" cue — pinned to the bottom of the screen, scrolls to the projects */}
      <a
        href="#seasonal-picks"
        className={`${styles.cue} ${picksInView ? styles.cueAway : ""}`}
        tabIndex={picksInView ? -1 : undefined}
      >
        <span className={styles.cueInner}>
          <span>start shopping</span>
          <svg className={styles.cueArrow} width="25" height="14" viewBox="0 0 25 14" fill="none" aria-hidden="true">
            <path d="M0.707092 0.721985L12.2071 12.222L24.2071 0.721985" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      </a>
    </section>
  );
}
