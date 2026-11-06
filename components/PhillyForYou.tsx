"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PhillyForYou.module.css";

/**
 * The Inquirer's "Philly For You" feed for its case study's Final Designs (Figma 316:1390), rebuilt
 * in code: on the left the signed-in feed swipes up story to story like a short-video feed, ending
 * on its "you've reached the end" card, and loops; on the right, the paywall a free reader hits.
 * Sized in --pu (1 Figma px in the popup). The feed only runs while it's on screen; with reduced
 * motion the stories crossfade instead of sliding.
 */

const ART = "/projects/inquirer/pfy";

type Slide = { kind: "story"; top: string } | { kind: "end" };

// Figma's variants: the first story opens on the cake, the rest on the second photo; then the end
const SLIDES: Slide[] = [
  { kind: "story", top: `${ART}/top-1.webp` },
  { kind: "story", top: `${ART}/top-2.webp` },
  { kind: "end" },
];

const HOLD = { story: 2200, end: 2800 }; // ms on each slide before the next swipe
const SWIPE = 700; // ms, the swipe itself

function Story({ top }: { top: string }) {
  return (
    <div className={styles.slide}>
      <div className={styles.photos}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={top} alt="" width={320} height={190} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ART}/storefront.webp`} alt="" width={320} height={190} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ART}/dish.webp`} alt="" width={320} height={188} />
      </div>
      <div className={styles.title}>
        <div className={styles.article}>
          <p className={styles.eyebrow}>Food</p>
          <p className={styles.headline}>Article Title</p>
          <div className={styles.author}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.avatar} src={`${ART}/avatar.webp`} alt="" width={40} height={40} />
            <div>
              <p className={styles.name}>Craig Laban</p>
              <p className={styles.role}>Staff Writer</p>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <span className={styles.save}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ART}/save.svg`} alt="" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.share} src={`${ART}/share.svg`} alt="" />
        </div>
      </div>
    </div>
  );
}

/** the light card on the Inquirer yellow: the paywall, or the feed's last card */
function Card({
  title,
  children,
  button,
  top,
  gap,
}: {
  title: string;
  children: React.ReactNode;
  button: string;
  top: number;
  gap: number;
}) {
  return (
    <div
      className={styles.card}
      style={{ top: `calc(${top} * var(--pu))`, gap: `calc(${gap} * var(--pu))` }}
    >
      <p className={styles.cardTitle}>{title}</p>
      {children}
      <span className={styles.button}>{button}</span>
    </div>
  );
}

const EndCard = () => (
  <div className={`${styles.slide} ${styles.yellow}`}>
    <Card title="You’ve reached the end of Philly for You!" button="Read more" top={157} gap={16}>
      <p className={styles.cardText}>
        Check back in tomorrow for more curated articles. In the meantime, check out more articles
        on your FYP.
      </p>
    </Card>
  </div>
);

const SlideView = ({ s }: { s: Slide }) =>
  s.kind === "end" ? <EndCard /> : <Story top={s.top} />;

function Feed() {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0); // stories swiped so far; the current slide is k % length
  const [swiping, setSwiping] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);
    let t = 0;
    let n = 0;
    const hold = () => {
      const s = SLIDES[n % SLIDES.length];
      t = window.setTimeout(swipe, s.kind === "end" ? HOLD.end : HOLD.story);
    };
    const swipe = () => {
      setSwiping(true);
      t = window.setTimeout(() => {
        n += 1;
        // the next slide is now the current one: drop the offset without animating it
        setK(n);
        setSwiping(false);
        hold();
      }, SWIPE);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(t);
        if (e.isIntersecting) hold();
        else {
          setSwiping(false);
          n = 0;
          setK(0);
        }
      },
      { root: el.closest<HTMLElement>("[data-lenis-prevent]"), threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, []);

  const cur = SLIDES[k % SLIDES.length];
  const next = SLIDES[(k + 1) % SLIDES.length];

  return (
    <div ref={ref} className={`${styles.phone} ${styles.feed}`}>
      {reduced ? (
        // reduced motion: the next story fades in over the current one
        <div className={styles.fadeStack}>
          <div className={styles.fadeSlide}>
            <SlideView s={cur} />
          </div>
          <div className={`${styles.fadeSlide} ${swiping ? styles.fadeIn : styles.fadeOut}`}>
            <SlideView s={next} />
          </div>
        </div>
      ) : (
        <div className={`${styles.track} ${swiping ? styles.swiping : ""}`}>
          <SlideView s={cur} />
          <SlideView s={next} />
        </div>
      )}
      {/* the feed's bar stays put over the stories */}
      <div className={styles.bar}>
        <span className={styles.back}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ART}/back.svg`} alt="" />
        </span>
        <p className={styles.barTitle}>Philly For You</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.fwd} src={`${ART}/forward.svg`} alt="" />
      </div>
    </div>
  );
}

function Paywall() {
  return (
    <div className={`${styles.phone} ${styles.yellow}`}>
      <Card title="Subscribe to get the full Philly experience" button="Subscribe" top={122} gap={7}>
        <p className={`${styles.cardText} ${styles.free}`}>
          Free accounts receive <b>2</b> full articles. If you’re already subscribed sign in{" "}
          <b className={styles.link}>here</b>
        </p>
        <ul className={styles.perks}>
          {["Unlimited access to all articles", "Personalized content", "Access to all audio features"].map(
            (t) => (
              <li key={t}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ART}/check.svg`} alt="" width={24} height={24} />
                <span>{t}</span>
              </li>
            ),
          )}
        </ul>
      </Card>
    </div>
  );
}

export default function PhillyForYou() {
  return (
    <div
      className={styles.frame}
      role="img"
      aria-label="Philly For You: a feed of the day’s Philly stories that swipes up one story at a time, next to the paywall free readers reach, asking them to subscribe"
    >
      <Feed />
      <Paywall />
    </div>
  );
}
