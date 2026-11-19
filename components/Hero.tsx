"use client";

import { markIntroPlayed, shouldSkipIntro } from "@/lib/intro";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import StickerCard from "@/components/StickerCard";
import ThemeToggle from "@/components/ThemeToggle";
import FlapWord from "@/components/FlapWord";
import ThemedPair from "@/components/ThemedPair";
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
    m: null,
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
    m: [51.04, 506.96, 484.52, 453.86, 26.23],
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
    m: [0, 0, 393, 1, 0, "bare"],
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
    m: [-183.99, 179.43, 541.8, 515.96, 0],
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
    /** phone layout (Figma 231:1707, 393 wide): x, y, w, h [, rotation°] in phone px from the
        tomato's phone box */
    m?: number[];
    w: number;
    h: number;
    x: number;
    y: number;
    peel: number;
    label: string;
    /** what the receipt calls it under "most viewed" */
    name: string;
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
      m: [166, 166.56, 136.88, 116.81],
      w: 225.1,
      h: 192.1,
      x: 200,
      y: 258.56,
      peel: 106,
      label: "CrowdVolt #YCW24",
      name: "CrowdVolt",
      title: "Shaping My Path",
      story:
        "Being my first in-person design internship made CrowdVolt a very special place to me, more so since I spent 9 months and 104 cups of coffee there. Working at a startup has taught me how to wear multiple hats and not to shy away when something is unfamiliar to me. Learning is always possible, and I owe it big time to a team so supportive of my growth. Whether I was creating event graphics or new product flows, no two days were the same. Truly a pivotal experience for me as a designer, and one that solidified my confidence in this industry.",
      lessons: ["Versatility", "Growth Mindset", "Ownership"],
      photos: [1, 2, 3, 4, 5, 6].map((n) => `/cards/crowdvolt-${n}.webp`),
    },
    {
      src: "/home/sticker-jakarta.webp",
      m: [276.99, 238.99, 155.85, 152.02],
      w: 256.3,
      h: 250,
      x: 438,
      y: 463.77,
      peel: 154,
      label: "Born and raised Jakarta 0717",
      name: "Jakarta",
      title: "My Forever Home",
      story:
        "I grew up in the bustling metropolis of Jakarta, Indonesia. This city is where I found my love for food and the arts, supported by the culture I am surrounded with. Jakarta and its people are what I built my values on. Warmth, humility, curiosity, and diligence are just some to mention. I’ve been moving around a lot, building my versatility, finding my footing wherever I am, but Jakarta will always be my home.",
      lessons: ["Warmth", "Curiosity", "Humility"],
      photos: [1, 7, 2, 3, 4, 5, 6].map((n) => `/cards/jakarta-${n}.webp`),
    },
    {
      src: "/home/sticker-cornell.webp",
      m: [374.9, 186.57, 85.13, 107.45],
      w: 140,
      h: 176.7,
      x: 599,
      y: 377.56,
      peel: 57,
      label: "Cornell Agriculture #2025",
      name: "Cornell",
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
      m: [145.9, 262.93, 143.87, 137.13],
      w: 213.5,
      h: 203.5,
      x: 314.18,
      y: 363.16,
      peel: 116,
      label: "Fatboy supperclub NYC",
      name: "Fatboy Supperclub",
      title: "Fighting Sunday Scaries",
      story:
        "Having a life-long interest in food and a curiosity for how people experience things, I find running front of house at a supper club to be a natural fit. Every month, my friends and I host a 24-person dinner, serving 5 courses and emulating the dining experience of eating at a friend\u2019s house. This has allowed me to excel in guest experience and hospitality, but at the end of the day, it is something I do for the sake of food and people.\n\nYou can be a guest too! More information [here](https://www.instagram.com/fatboy.supperclub/) :)",
      lessons: ["Guest experience", "Hospitality", "Food"],
      photos: ["group", 1, 2, 3, "crowd", 5, 6].map((n) => `/cards/fatboy-${n}.webp`),
    },
    {
      src: "/home/sticker-design-meetup.webp",
      m: [186.9, 177.92, 189.03, 189.03],
      w: 280.5,
      h: 280.5,
      x: 383.18,
      y: 213.16,
      peel: 175,
      label: "Design meetup",
      name: "Design Meetup",
      // the triangle only — its empty corners sit over the Fatboy sticker
      hit: "20.7% 72%, 24.2% 59%, 36.2% 24.2%, 38.7% 17.1%, 42.2% 13.5%, 46.9% 14.3%, 70.4% 41%, 83.6% 56.1%, 85.2% 61.5%, 82.4% 65.1%, 77.9% 66.1%, 38.7% 73.8%, 28.5% 75.8%, 22.8% 74.9%",
      title: "Finding Footing in the City",
      story:
        "Design Meetup was founded by friends I had from college, and I was seeing the impact it could have on designers throughout the country. I joined events shortly after its conception, and I ended up joining as a graphic lead in hopes of contributing to this wonderful cause, helping creatives find their footing in big cities, just like how it helped me find my footing in the crazy world of design. Design Meetup has lead me to amazing people who anchor me as a creative and taught me that things are more achievable when done in unison.",
      lessons: ["Communication", "Collaboration", "Community"],
      // the group photo is landscape: two copies stacked fill the card's portrait frame
      photos: ["group", "crowd", "walk", "studio"].map((n) => `/cards/design-meetup-${n}.webp`),
    },
  ],
  mid: [
    {
      src: "/home/sticker-nyu-2.webp",
      m: [102.58, 672.44, 150.28, 158.36, 41.91],
      w: 223,
      h: 235,
      x: 397.07,
      y: 184.87,
      peel: 128,
      label: "NYU design YR 2027",
      name: "NYU",
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
          ...(s.m
            ? { "--mx": s.m[0], "--my": s.m[1], "--mw": s.m[2], "--mh": s.m[3], "--mr": `${s.m[4] ?? 0}deg` }
            : {}),
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
      <span className={styles.stickerHit} aria-hidden="true" data-cursor="cart" />
    </button>
  );
}

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
      data-tomato={id}
      className={`${styles.layer} ${styles.tomato} theme-pair ${t.m ? "" : styles.offPhone} ${t.m?.[5] === "bare" ? styles.bareOnPhone : ""}`}
      style={
        {
          "--x": t.x,
          "--y": t.y,
          "--w": t.dw,
          "--h": t.dh,
          "--o": t.opacity,
          "--i": t.order,
          // phone layout (Figma 231:1707): box in phone px (1/393 of the width) + the turn that
          // tomato takes there
          ...(t.m
            ? { "--mx": t.m[0], "--my": t.m[1], "--mw": t.m[2], "--mh": t.m[3], "--mr": `${t.m[4]}deg` }
            : {}),
        } as React.CSSProperties
      }
    >
      {/* light / dark versions crossfade on the theme switch; dark mode shows the tomatoes
          through Figma's gradient map (210:5014), pre-rendered into /home/dark/ */}
      <ThemedPair
        light={t.src}
        dark={t.src.replace("/home/", "/home/dark/")}
        // wait until the picture is decoded too, so nothing stutters once the drop starts
        onFirstReady={onLoad}
        render={(v) => (
          // served as-is: the optimiser's downscale + re-encode put visible blocks in the soft
          // gradients. Phones get a 900px copy (a clean Lanczos downscale of the same render,
          // still 2× + at their size); everything wider gets the full render.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={v.className}
            ref={v.imgRef}
            src={v.src}
            srcSet={`${v.src.replace(/\.webp$/, "-900.webp")} 900w, ${v.src} ${t.w}w`}
            sizes="(max-width: 767px) 70vw, 100vw"
            alt=""
            width={t.w}
            height={t.h}
            decoding="async"
            fetchPriority={v.className === "theme-light" ? "high" : "auto"}
            onLoad={v.onLoad}
            data-ready={v.ready ? "" : undefined}
            className={`${styles.tomatoImg} ${v.className}`}
          />
        )}
      />
      {stickers[id]?.map((s) => (
        <Sticker key={s.src} s={s} onOpen={onOpen} away={activeSrc === s.src} />
      ))}
    </div>
  );
}

// how far down each tomato picture its solid body starts and ends (the rest is soft blur)
const BODY_TOP: Record<string, number> = { small: 0.196, right: 0.127, mid: 0.1, left: 0.13 };
// (bottoms: where it's still solid colour, before the soft fade at its foot)
const BODY_BOTTOM: Record<string, number> = { small: 0.765, right: 0.869, mid: 0.875, left: 0.849 };

/** an element's position on the page from its layout box, ignoring any transform it's animating */
const layoutBox = (el: HTMLElement) => {
  let top = 0;
  let left = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    top += n.offsetTop;
    left += n.offsetLeft;
  }
  return { top, left, bottom: top + el.offsetHeight, right: left + el.offsetWidth };
};

export default function Hero() {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  // arriving from another page via the logo: no intro, everything already in place
  const [skip, setSkip] = useState(false);

  // two rules for where the tomatoes sit (--push lowers one, stickers riding along):
  //  1. they always reach the bottom of the screen: if the lowest tomato's solid colour stops short
  //     of it, all of them come down together until it runs just past the bottom edge;
  //  2. a tomato's body never comes up over the headline: any tomato under the text column that
  //     starts above the grey "currently" line (+ a little room) comes down further, below it.
  const headlineRef = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const head = headlineRef.current;
      const now = head?.lastElementChild as HTMLElement | null;
      if (!head || !now) return;
      // the text column: from the headline's left to the end of the longest line under the name
      const box = layoutBox(head);
      let width = 0;
      for (const line of [...head.children].slice(1)) {
        const r = document.createRange();
        r.selectNodeContents(line);
        width = Math.max(width, r.getBoundingClientRect().width);
      }
      const text = { left: box.left, right: box.left + width };
      const floor = layoutBox(now).bottom + Math.max(12, head.offsetWidth * 0.016);
      const shown = [...document.querySelectorAll<HTMLElement>("[data-tomato]")].filter((t) => {
        t.style.setProperty("--push", "0px");
        return t.offsetHeight >= 4; // in this layout (not hidden / the phone's bare stand-in)
      });
      const body = (t: HTMLElement, at: Record<string, number>, fallback: number) => {
        const b = layoutBox(t);
        return b.top + (at[t.dataset.tomato ?? ""] ?? fallback) * t.offsetHeight;
      };
      // rule 1: the lowest solid body runs 16px past the bottom of the screen
      const lowest = Math.max(...shown.filter((t) => t.dataset.tomato !== "small").map((t) => body(t, BODY_BOTTOM, 0.9)));
      const all = Number.isFinite(lowest) ? Math.max(0, window.innerHeight + 16 - lowest) : 0;
      shown.forEach((t) => {
        const b = layoutBox(t);
        const under = b.left < text.right && b.right > text.left;
        const top = body(t, BODY_TOP, 0.12) + all;
        const push = all + (under && top < floor ? floor - top : 0);
        if (push) t.style.setProperty("--push", `${Math.ceil(push)}px`);
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (headlineRef.current) ro.observe(headlineRef.current);
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);
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
  // — only when it was opened from the keyboard: after a tap or a click, putting focus back would
  // just draw a focus ring around the sticker
  const byKeyboard = useRef(false);
  useEffect(() => {
    if (card) {
      lastOrigin.current = card.el;
      byKeyboard.current = card.el.matches(":focus-visible");
    } else if (lastOrigin.current) {
      if (byKeyboard.current) lastOrigin.current.focus({ preventScroll: true });
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
          <img className={styles.signLight} src="/home/open-sign.png" alt="" width={768} height={696} />
          {/* dark mode: the same sign, its string in the light ink so it shows on the dark page */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.signDark} src="/home/dark/open-sign.png" alt="" width={768} height={696} />
        </div>
      </div>

      <h1 className="visually-hidden">
        hope’s grocer — the portfolio of Matthew Hope, product designer
      </h1>
      {/* Figma 523:926 — the name (Host Grotesk Bold 128) and two lines under it (Regular 40 / 40);
          each line rises in after the tomatoes */}
      <p ref={headlineRef} className={styles.headline}>
        <span className={`${styles.line} ${styles.nameLine}`}>
          Matthew Hope
          {/* Figma 538:1620: the changing word at its top right; rolls in as the name rises (--text-delay) */}
          <FlapWord className={styles.nameTag} startIn={skip ? 1050 : 3300} />
        </span>
        <span className={`${styles.line} ${styles.subLine}`}>
          Agricultural scientist turned designer based in NYC
        </span>
        <span className={`${styles.line} ${styles.subLine}`}>
          Creating with the same rigor, for solutions that people enjoy using
        </span>
        {/* Figma 546:1666: where I am and have been, grey caps, each place linking out */}
        <span className={`${styles.line} ${styles.nowLine}`}>
          Currently{" "}
          <a href="https://25madison.com" target="_blank" rel="noopener noreferrer">
            25Madison
          </a>
          , prev{" "}
          <a href="https://www.crowdvolt.com" target="_blank" rel="noopener noreferrer">
            CrowdVolt (YC24)
          </a>
          ,{" "}
          <a href="https://www.inquirer.com" target="_blank" rel="noopener noreferrer">
            The Philadelphia Inquirer
          </a>
        </span>
      </p>

      {/* Figma 210:5291 — light / dark switch, top right of the landing */}
      <ThemeToggle className={styles.themeToggle} />

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
