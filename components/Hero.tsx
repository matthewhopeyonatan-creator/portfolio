"use client";

import { markIntroPlayed, shouldSkipIntro } from "@/lib/intro";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import StickerCard from "@/components/StickerCard";
import TomatoGrain from "@/components/TomatoGrain";
import { useCart } from "@/components/cart/CartContext";
import { stickerItems } from "@/data/site";
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
  small: {
    src: "/home/tomato-small.webp",
    w: 1243,
    h: 1290,
    x: 1047.68,
    y: -20,
    /* Figma −145.26, lowered so the navbar never crops it */ dw: 621.5,
    dh: 645,
    opacity: 0.7,
    order: 3,
  },
  right: {
    src: "/home/tomato-right-base.webp",
    w: 1438,
    h: 1347,
    x: 1108.82,
    y: 145.84,
    dw: 719,
    dh: 673.5,
    opacity: 0.9,
    order: 2,
  },
  mid: {
    src: "/home/tomato-mid-base.webp",
    w: 1501,
    h: 1579,
    x: 644.75,
    y: 275.77,
    dw: 750.5,
    dh: 789.5,
    opacity: 1,
    order: 1,
  },
  left: {
    src: "/home/tomato-left-base.webp",
    w: 1782,
    h: 1697,
    x: -195,
    y: 136.44,
    /* Figma 246.44, raised so the Jakarta sticker stays on screen */ dw: 891,
    dh: 848.5,
    opacity: 1,
    order: 0,
  },
};

/**
 * Fruit stickers, positioned on their tomato (design px from the tomato image's top-left; Figma
 * render bounds). `peel` = how far the lower-right fold travels on hover, tuned per shape so it
 * cuts ~27px into each sticker.
 */
const stickers: Record<
  string,
  {
    src: string;
    w: number;
    h: number;
    x: number;
    y: number;
    peel: number;
    label: string;
    title: string;
    story?: string;
    lessons?: string[];
    /** photos for the card's image box (a carousel when there's more than one) */
    photos?: (string | { src: string; focus: string })[];
    inset?: [number, number];
    /** clickable outline (CSS polygon points, % of the image) for stickers that overlap others */
    hit?: string;
  }[]
> = {
  left: [
    {
      src: "/home/sticker-crowdvolt-ycw24.webp",
      w: 225.1,
      h: 192.1,
      x: 200,
      y: 258.56,
      peel: 106,
      label: "CrowdVolt #YCW24",
      title: "Shaping My Path",
      story:
        "Being my first in-person design internship made CrowdVolt a very special place to me, more so since I spent 9 months and 104 cups of coffee there. Working at a startup has taught me how to wear multiple hats and not to shy away when something is unfamiliar to me. Learning is always possible, and I owe it big time to a team so supportive of my growth. Whether I was creating event graphics or new product flows, no two days were the same. Truly a pivotal experience for me as a designer, and one that solidified my confidence in this industry.",
      lessons: ["Versatility", "Growth Mindset", "Ownership"],
      photos: [1, 2, 3, 4, 5, 6].map((n) => `/cards/crowdvolt-${n}.webp`),
    },
    {
      src: "/home/sticker-jakarta.webp",
      w: 256.3,
      h: 250,
      x: 438,
      y: 463.77,
      peel: 154,
      label: "Born and raised Jakarta 0717",
      title: "My Forever Home",
      story:
        "I grew up in the bustling metropolis of Jakarta, Indonesia. This city is where I found my love for food and the arts, supported by the culture I am surrounded with. Jakarta and its people are what I built my values on. Warmth, humility, curiosity, and diligence are just some to mention. I’ve been moving around a lot, building my versatility, finding my footing wherever I am, but Jakarta will always be my home.",
      lessons: ["Warmth", "Curiosity", "Humility"],
      photos: [1, 7, 2, 3, 4, 5, 6].map((n) => `/cards/jakarta-${n}.webp`),
    },
    {
      src: "/home/sticker-cornell.webp",
      w: 140,
      h: 176.7,
      x: 599,
      y: 377.56,
      peel: 57,
      label: "Cornell Agriculture #2025",
      inset: [22, 20], // its tilted corner otherwise touches the photo's corner
      title: "Shaping My Youth",
      story:
        "I did my bachelor’s degree in agricultural sciences in hopes of understanding the entire process behind the food system. Although not explicitly related to my career path as a designer, Cornell was an integral experience to my personal growth. As a transfer student, I had to learn how to adapt quickly and put myself out there. In a short time of 2 years, I am proud to say that I have made myself at home there. My involvement in dance, design, research, and the sciences speaks to my current existence as a whole.",
      lessons: ["Research", "Adaptability", "Sociability"],
      photos: [
        "/cards/cornell-4.webp",
        "/cards/cornell-1.webp",
        "/cards/cornell-2.webp",
        "/cards/cornell-3.webp",
        "/cards/cornell-5.webp",
        // film shot: crop toward its left so the six people sit in the middle
        { src: "/cards/cornell-6.webp", focus: "36% 50%" },
      ],
    },
  ],
  right: [
    {
      src: "/home/sticker-fatboy.webp",
      w: 213.5,
      h: 203.5,
      x: 314.18,
      y: 363.16,
      peel: 116,
      label: "Fatboy supperclub NYC",
      title: "Fighting Sunday Scaries",
      story:
        "Having a life-long interest in food and a curiosity for how people experience things, I find running front of house at a supper club to be a natural fit. Every month, my friends and I host a 24-person dinner, serving 5 courses and emulating the dining experience of eating at a friend\u2019s house. This has allowed me to excel in guest experience and hospitality, but at the end of the day, it is something I do for the sake of food and people.\n\nYou can be a guest too! More information [here](https://www.instagram.com/fatboy.supperclub/) :)",
      lessons: ["Guest experience", "Hospitality", "Food"],
      photos: [1, 2, 3, 4, 5, 6].map((n) => `/cards/fatboy-${n}.webp`),
    },
    {
      src: "/home/sticker-design-meetup.webp",
      w: 280.5,
      h: 280.5,
      x: 383.18,
      y: 213.16,
      peel: 175,
      label: "Design meetup",
      // the triangle only — its empty corners sit over the Fatboy sticker
      hit: "20.7% 72%, 24.2% 59%, 36.2% 24.2%, 38.7% 17.1%, 42.2% 13.5%, 46.9% 14.3%, 70.4% 41%, 83.6% 56.1%, 85.2% 61.5%, 82.4% 65.1%, 77.9% 66.1%, 38.7% 73.8%, 28.5% 75.8%, 22.8% 74.9%",
      title: "Design Meetup",
    },
  ],
  mid: [
    {
      src: "/home/sticker-nyu-2.webp",
      w: 223,
      h: 235,
      x: 397.07,
      y: 184.87,
      peel: 128,
      label: "NYU design YR 2027",
      title: "Quarter Life Pivot",
      story:
        "After a series of existential crises and feeling a gap in my career, I decided to pursue my master’s degree in Integrated Design and Media at NYU to delve deeper into multimedia design. Being in a completely different field than I was for the past 21 years of my life was difficult, but I know that design is where I am meant to be. I got to meet the brightest minds in design, work on meaningful products in the startup space, and challenge myself in learning things I had never touched before. Most importantly, living in New York City has allowed me to unlock inhumane amounts of frozen yogurt.",
      lessons: ["Agility", "Initiative", "Collaboration"],
      photos: [
        "/cards/nyu-1.webp",
        "/cards/nyu-2.webp",
        // tall shot: keep the people on stage in view
        { src: "/cards/nyu-3.webp", focus: "50% 62%" },
        "/cards/nyu-4.webp",
        "/cards/nyu-5.webp",
      ],
    },
  ],
};

type StickerData = (typeof stickers)["left"][number];
type OpenSticker = (s: StickerData, el: HTMLElement) => void;

/** A sticker on a tomato: peels on hover; click opens its story card (StickerCard). */
function Sticker({
  s,
  onOpen,
  away,
}: {
  s: StickerData;
  onOpen: OpenSticker;
  away: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.sticker} ${away ? styles.stickerAway : ""}`}
      aria-label={`${s.label} — open`}
      aria-haspopup="dialog"
      onClick={(e) => onOpen(s, e.currentTarget)}
      style={
        {
          "--sx": s.x,
          "--sy": s.y,
          "--sw": s.w,
          "--sh": s.h,
          "--pd": s.peel,
          ...(s.hit ? { "--hit": `polygon(${s.hit})` } : {}),
        } as React.CSSProperties
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.stickerFace}
        src={s.src}
        alt=""
        draggable={false}
      />
      <span className={styles.stickerFlapWrap} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.stickerFlap}
          src={s.src}
          alt=""
          draggable={false}
        />
      </span>
      {/* the clickable area — trimmed to the sticker's shape where neighbours overlap */}
      <span className={styles.stickerHit} aria-hidden="true" />
    </button>
  );
}

// the headline's phrases, and which ones sit on each of its three lines (Figma line breaks)
const phrases = [
  "Consumer focused,",
  "research driven,",
  "visually expressive,",
  "startup trained,",
  "agile and versatile",
];
const headlineLines = [[0, 1], [2, 3], [4]];

type TomatoKey = keyof typeof tomatoes;

function Tomato({
  id,
  onLoad,
  onOpen,
  activeSrc,
}: {
  id: TomatoKey;
  onLoad: () => void;
  onOpen: OpenSticker;
  activeSrc?: string;
}) {
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
      <Image
        src={t.src}
        alt=""
        width={t.w}
        height={t.h}
        priority
        sizes="52vw"
        onLoad={(e) => {
          // wait until the image is decoded too, so nothing stutters once the drop starts
          const img = e.currentTarget;
          (img.decode ? img.decode() : Promise.resolve())
            .catch(() => {})
            .then(onLoad);
        }}
        className={styles.tomatoImg}
      />
      <TomatoGrain />
      {stickers[id]?.map((s) => (
        <Sticker key={s.src} s={s} onOpen={onOpen} away={activeSrc === s.src} />
      ))}
    </div>
  );
}

export default function Hero() {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  // arriving from another page via the logo: no intro, everything already in place
  const [skip, setSkip] = useState(false);
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
      el.style.setProperty(
        "--iy",
        `${vh / 2 - (r.height * scale) / 2 - pivotY}px`,
      );
    }
    setReady(true);
    // lift the hero above the page while the big sign is on screen, then drop it back
    setIntroRunning(true);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.setTimeout(
      () => {
        setIntroRunning(false);
        document.documentElement.dataset.intro = "done"; // reveals the rest of the page
      },
      reduce ? 0 : 2800,
    );
  };

  useEffect(() => {
    const skipNow = shouldSkipIntro();
    markIntroPlayed();
    if (!skipNow) return;
    started.current = true;
    setSkip(true);
    setReady(true);
    document.documentElement.dataset.intro = "done";
  }, []);

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
      interval = window.setInterval(
        () => setActivePhrase((i) => (i + 1) % phrases.length),
        1000,
      );
    }, skip ? 2000 : 4200);
    return () => {
      window.clearTimeout(startAt);
      window.clearInterval(interval);
    };
  }, [ready, skip]);

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
    const io = new IntersectionObserver(
      ([entry]) => setPicksInView(entry.isIntersecting),
      {
        rootMargin: "0px 0px -10% 0px",
      },
    );
    io.observe(picks);
    return () => io.disconnect();
  }, []);

  const onLoad = () => setLoaded((n) => n + 1);

  // the sticker whose story card is open (its tomato copy hides while the card has it)
  const [card, setCard] = useState<{ s: StickerData; el: HTMLElement } | null>(
    null,
  );
  const { add } = useCart();
  const openCard: OpenSticker = (s, el) => {
    // opening a sticker's story puts that sticker in the cart
    const item = stickerItems.find((i) => i.src === s.src);
    if (item) add(item.key);
    setCard((c) => c ?? { s, el });
  };
  const tomatoProps = { onLoad, onOpen: openCard, activeSrc: card?.s.src };
  // after a card closes, focus goes back to the sticker that opened it (once it's visible again)
  const lastOrigin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (card) lastOrigin.current = card.el;
    else if (lastOrigin.current) {
      lastOrigin.current.focus({ preventScroll: true });
      lastOrigin.current = null;
    }
  }, [card]);

  return (
    <section
      className={`${styles.hero} ${ready ? styles.play : ""} ${introRunning ? styles.introRunning : ""} ${skip ? styles.skip : ""}`}
      aria-label="Intro"
    >
      <noscript>
        <style>{`.${styles.hero} .${styles.layer}{opacity:1!important;animation:none!important}#seasonal-picks,.page-after-hero{opacity:1!important}`}</style>
      </noscript>
      <div className={styles.canvas}>
        <Tomato id="small" {...tomatoProps} />
        <Tomato id="right" {...tomatoProps} />
        <Tomato id="mid" {...tomatoProps} />
        <Tomato id="left" {...tomatoProps} />

        <div
          ref={signRef}
          className={`${styles.layer} ${styles.sign}`}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/open-sign.png" alt="" width={768} height={696} />
        </div>
      </div>

      <h1 className="visually-hidden">
        hope’s grocer — the portfolio of Matthew Hope, product designer
      </h1>
      {/* Figma 21:168 — 64px Regular, 60 leading. One phrase at a time is in full ink, the rest at 50%;
          the highlight moves on every 1s. */}
      <p className={styles.headline}>
        {headlineLines.map((line, li) => (
          <span key={li} className={styles.line}>
            {line.map((pi, j) => (
              <span
                key={pi}
                className={`${styles.phrase} ${pi === activePhrase ? styles.phraseOn : ""}`}
              >
                {phrases[pi]}
                {j < line.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        ))}
      </p>

      {card && (
        <StickerCard
          sticker={card.s}
          origin={card.el}
          onClosed={() => setCard(null)}
        />
      )}

      {/* Figma "start shopping" cue — pinned to the bottom of the screen, scrolls to the projects */}
      <a
        href="#seasonal-picks"
        className={`${styles.cue} ${picksInView ? styles.cueAway : ""}`}
        tabIndex={picksInView ? -1 : undefined}
      >
        <span className={styles.cueInner}>
          <span>start shopping</span>
          <svg
            className={styles.cueArrow}
            width="25"
            height="14"
            viewBox="0 0 25 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0.707092 0.721985L12.2071 12.222L24.2071 0.721985"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </span>
      </a>
    </section>
  );
}
