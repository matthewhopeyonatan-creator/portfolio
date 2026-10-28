"use client";

import { useEffect, useRef } from "react";
import { SNAKE, WELCOME_NAME, WELCOME_WORD } from "./shmoodPaths";
import styles from "./ShmoodScreens.module.css";

/**
 * Shmood's onboarding screens rebuilt in code for its case study (Figma 166:3430, 166:3435,
 * 166:3449, 166:3466). Each is a 2332 × 1433 frame laid out in frame px (`--s`, from the screen's
 * own width). They come alive while on screen:
 * - welcome: "Welcome," then "Matthew" rise in out of a soft blur
 * - story: the red line draws itself through the collage like a snake, slipping under some
 *   pictures and over others, then slides away tail first and comes round again
 * - aesthetic / designer: the cards are choices — one at a time lifts toward you, as if to say
 *   "pick me", and settles back
 */
export type ShmoodScreen = "welcome" | "story" | "aesthetic" | "designer";

const DIR = "/projects/shmood/screens";
const W = 2332;
const H = 1433;

type Box = [x: number, y: number, w: number, h: number];
const at = ([x, y, w, h]: Box) =>
  ({ "--x": x, "--y": y, "--w": w, "--h": h }) as React.CSSProperties;

const LOGO: Box = [38, 32, 200, 100];
const TRACK: Box = [968.5, 104.5, 395, 33.8];

// the collage, back to front — the line sits between the third and fourth picture
const STORY_BACK: { src: string; alt: string; box: Box }[] = [
  {
    src: "c1",
    alt: "Magenta poster of interlocking rings",
    box: [123, 1112, 426.2, 489.2],
  },
  {
    src: "c2",
    alt: "COBOL programming course poster",
    box: [1687, 875, 428.2, 745.5],
  },
  {
    src: "c3",
    alt: "Vintage Japanese fashion magazine page",
    box: [1166, -166, 359, 553.3],
  },
];
const STORY_FRONT: { src: string; alt: string; box: Box }[] = [
  {
    src: "c4",
    alt: "Memphis Milano furniture poster",
    box: [677, 834, 336.7, 490.2],
  },
  {
    src: "c5",
    alt: "Constructivist red circle poster",
    box: [1821, 186, 386.5, 453.6],
  },
  {
    src: "c6",
    alt: "Southwest Airlines SWA logo",
    box: [202, 200, 346.8, 230.9],
  },
];

const AESTHETIC: { src: string; label: string; box: Box }[] = [
  {
    src: "aMid",
    label: "Mid Century Modern",
    box: [1167.1, 417.6, 717.9, 458.3],
  },
  { src: "aVic", label: "Victorian", box: [1620.1, 490.9, 711.9, 588.9] },
  { src: "aBoh", label: "Bohemian", box: [1645.3, 132, 686.7, 552.5] },
  { src: "aJap", label: "Japandi", box: [1559.9, 847.7, 745.6, 507.3] },
  { src: "aBru", label: "Brutalism", box: [899, 728.4, 777.1, 570.6] },
];
const DESIGNER: { src: string; label: string; box: Box }[] = [
  { src: "dStr", label: "Structural", box: [1479, 640, 801.9, 631.7] },
  { src: "dEdi", label: "Editorial", box: [100, 734, 740.4, 497.9] },
  { src: "dFin", label: "Fine Arts", box: [1052.5, 884.5, 743.5, 503.6] },
  { src: "dDig", label: "Digital Design", box: [470, 956, 809.1, 477] },
];

const LABEL: Record<ShmoodScreen, string> = {
  welcome: "Shmood onboarding: Welcome, Matthew",
  story:
    "Shmood onboarding: Your story shapes our design. Tell us more about you.",
  aesthetic:
    "Shmood questionnaire: Which aesthetic speaks to you? Mid Century Modern, Victorian, Bohemian, Japandi or Brutalism",
  designer:
    "Shmood questionnaire: What type of designer are you? Structural, Editorial, Fine Arts or Digital Design",
};

/** data-play while the screen is on show (welcome keeps it once it has played) */
function usePlay(once: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.play = "";
          if (once) io.disconnect();
        } else if (!once) delete el.dataset.play;
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return ref;
}

/** one card at a time gets data-on while the screen is on show */
function useCardCycle(
  ref: React.RefObject<HTMLDivElement | null>,
  on: boolean,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !on) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-card]")];
    let i = -1;
    let t = 0;
    const step = () => {
      cards.forEach((c, k) => c.toggleAttribute("data-on", k === i));
      t = window.setTimeout(() => {
        cards[i]?.removeAttribute("data-on");
        i = (i + 1) % cards.length;
        t = window.setTimeout(step, 280);
      }, 1100);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(t);
        if (e.isIntersecting) {
          t = window.setTimeout(step, 500);
        } else {
          cards.forEach((c) => c.removeAttribute("data-on"));
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [ref, on]);
}

const Pic = ({
  src,
  box,
  alt = "",
  className = "",
}: {
  src: string;
  box: Box;
  alt?: string;
  className?: string;
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className={`${styles.part} ${className}`}
    style={at(box)}
    src={src}
    alt={alt}
    width={Math.round(box[2])}
    height={Math.round(box[3])}
    loading="lazy"
    decoding="async"
  />
);

function Cards({ cards }: { cards: typeof AESTHETIC }) {
  return (
    <>
      {cards.map((c) => (
        <div
          key={c.src}
          className={`${styles.part} ${styles.card}`}
          style={at(c.box)}
          data-card=""
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${DIR}/${c.src}.svg`}
            alt={c.label}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </>
  );
}

function Screen({ kind }: { kind: ShmoodScreen }) {
  const ref = usePlay(kind === "welcome");
  useCardCycle(ref, kind === "aesthetic" || kind === "designer");
  return (
    <div
      ref={ref}
      className={styles.screen}
      data-kind={kind}
      role="img"
      aria-label={LABEL[kind]}
    >
      <div className={styles.canvas} aria-hidden="true">
        {kind === "welcome" ? (
          <svg
            className={`${styles.part} ${styles.welcome}`}
            style={at([285.8, 679.6, 671.2, 74.5])}
            viewBox="0 0 672 75"
          >
            <path className={styles.word} d={WELCOME_WORD} fill="#282828" />
            <path className={styles.name} d={WELCOME_NAME} fill="#FF3B00" />
          </svg>
        ) : null}

        {kind === "story" ? (
          <>
            <Pic
              src={`${DIR}/story1.svg`}
              box={[285.2, 539.7, 1268.8, 101.4]}
            />
            <Pic
              src={`${DIR}/story2.svg`}
              box={[287.3, 660.7, 1011.1, 101.7]}
            />
            {STORY_BACK.map((p) => (
              <Pic
                key={p.src}
                src={`${DIR}/${p.src}.webp`}
                box={p.box}
                className={styles.photo}
              />
            ))}
            <svg
              className={`${styles.part} ${styles.snake}`}
              style={at([0, 78.5, 2075.5, 1354.5])}
              viewBox="0 0 2076 1355"
              fill="none"
            >
              <path d={SNAKE} pathLength={1} stroke="#FF3B00" strokeWidth={7} />
            </svg>
            {STORY_FRONT.map((p) => (
              <Pic
                key={p.src}
                src={`${DIR}/${p.src}.webp`}
                box={p.box}
                className={styles.photo}
              />
            ))}
          </>
        ) : null}

        {kind === "aesthetic" ? (
          <>
            <Pic src={`${DIR}/squiggle-track.svg`} box={TRACK} />
            <Pic
              src={`${DIR}/squiggle-aesthetic.svg`}
              box={[968.5, 104.5, 235.7, 33.8]}
            />
            <Pic
              src={`${DIR}/aesTitle.svg`}
              box={[184.9, 370.5, 799.5, 363.4]}
            />
            <Cards cards={AESTHETIC} />
          </>
        ) : null}

        {kind === "designer" ? (
          <>
            <Cards cards={DESIGNER} />
            <Pic src={`${DIR}/squiggle-track.svg`} box={TRACK} />
            <Pic
              src={`${DIR}/squiggle-designer.svg`}
              box={[968.5, 104.5, 140.2, 33.8]}
            />
            <Pic src={`${DIR}/desTitle.svg`} box={[674, 316.8, 984.1, 328.9]} />
          </>
        ) : null}

        <Pic src={`${DIR}/logo.svg`} box={LOGO} className={styles.logo} />
      </div>
    </div>
  );
}

/** two screens to a row, like the case study's figures */
export default function ShmoodScreens({
  screens,
}: {
  screens: ShmoodScreen[];
}) {
  return (
    <div
      className={styles.row}
      style={{ "--fw": W, "--fh": H } as React.CSSProperties}
    >
      {screens.map((s) => (
        <Screen key={s} kind={s} />
      ))}
    </div>
  );
}
