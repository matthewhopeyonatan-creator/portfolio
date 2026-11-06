"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PhillyForYou.module.css";

/**
 * The Inquirer's "Philly For You" feed for its case study's Final Designs (Figma 316:1390), rebuilt
 * in code: on the left the signed-in feed swipes up story to story like a short-video feed, round
 * and round; on the right, the paywall a free reader hits.
 * Sized in --pu (1 Figma px in the popup). The feed only runs while it's on screen; with reduced
 * motion the stories crossfade instead of sliding.
 */

const ART = "/projects/inquirer/pfy";

// the feed's stories: Figma's story layout (316:1986), each with its own three photos (from
// Wikimedia Commons, see public/projects/inquirer/pfy/CREDITS.md), headline and made-up byline
type StoryData = {
  category: string;
  title: string;
  author: string;
  /** made-up face (generated, not a real person) for the made-up writer */
  face: string;
  date: string;
  photos: [string, string, string];
};

const STORIES: StoryData[] = [
  {
    category: "Food",
    title: "New Restaurants Near You",
    author: "Dana Whitfield",
    face: "author-dana",
    date: "Nov 4, 2026",
    photos: ["r1", "r2", "r3"],
  },
  {
    category: "Today",
    title: "Philadelphia Local Dog Saves the Day",
    author: "Marcus Ortega",
    face: "author-marcus",
    date: "Nov 3, 2026",
    photos: ["d1", "d2", "d3"],
  },
  {
    category: "Politics",
    title: "New Mayor Is Elected",
    author: "Priya Raman",
    face: "author-priya",
    date: "Nov 2, 2026",
    photos: ["m1", "m2", "m3"],
  },
  {
    category: "Food",
    title: "Michelin Star Arrives in Philadelphia",
    author: "Theo Calloway",
    face: "author-theo",
    date: "Oct 31, 2026",
    photos: ["s1", "s2", "s3"],
  },
  {
    category: "Today",
    title: "Highway Under Construction, Here’s What to Do",
    author: "Jenna Brooks",
    face: "author-jenna",
    date: "Oct 30, 2026",
    photos: ["h1", "h2", "h3"],
  },
];

const HOLD = 2200; // ms on each story before the next swipe
const SWIPE = 700; // ms, the swipe itself

function Story({ s }: { s: StoryData }) {
  return (
    <div className={styles.slide}>
      <div className={styles.photos}>
        {s.photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p} src={`${ART}/${p}.webp`} alt="" width={320} height={i === 2 ? 188 : 190} />
        ))}
      </div>
      <div className={styles.title}>
        <div className={styles.article}>
          <p className={styles.eyebrow}>{s.category}</p>
          <p className={styles.headline}>{s.title}</p>
          <div className={styles.author}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.avatar} src={`${ART}/${s.face}.webp`} alt="" width={40} height={40} />
            <div>
              <p className={styles.name}>{s.author}</p>
              <p className={styles.role}>{s.date}</p>
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

/** the paywall's light card on the Inquirer yellow */
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
      t = window.setTimeout(swipe, HOLD);
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

  // the story on screen and the one under it (keys keep each story's element as it moves up)
  const cur = k % STORIES.length;
  const next = (k + 1) % STORIES.length;

  return (
    <div ref={ref} className={`${styles.phone} ${styles.feed}`}>
      {reduced ? (
        // reduced motion: the next story fades in over the current one
        <div className={styles.fadeStack}>
          <div key={cur} className={styles.fadeSlide}>
            <Story s={STORIES[cur]} />
          </div>
          <div key={next} className={`${styles.fadeSlide} ${swiping ? styles.fadeIn : styles.fadeOut}`}>
            <Story s={STORIES[next]} />
          </div>
        </div>
      ) : (
        <div className={`${styles.track} ${swiping ? styles.swiping : ""}`}>
          <Story key={cur} s={STORIES[cur]} />
          <Story key={next} s={STORIES[next]} />
        </div>
      )}
      {/* the feed's bar stays put over the stories */}
      <div className={styles.bar}>
        <span className={styles.back}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ART}/back.svg`} alt="" />
        </span>
        <p className={styles.barTitle}>Philly For You</p>
        {/* the forward arrow is hidden in the design; its slot keeps the title centred */}
        <span className={styles.fwd} />
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
