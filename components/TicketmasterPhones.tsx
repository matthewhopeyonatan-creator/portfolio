"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./TicketmasterPhones.module.css";

/**
 * CrowdVolt's ticket-batching screens for the Ticketmaster Flow case study (Figma 129:145 and
 * 129:166), rebuilt in code so two of them can play:
 *  - explore-4 (Figma 137:282): "clicking through each of the options" — the selection steps
 *    1 batch → 2 batches → 3 batches → custom, each with a little tap.
 *  - explore-6 (Figma 137:757): batch 2's "+" is tapped and a ticket moves down from batch 1 into
 *    batch 2, until they're even; then "−" sends them back up, and it repeats.
 * The final-design screens are static. Everything is sized in --pu (1 Figma px in the popup).
 * Both loops only run while they're on screen; with reduced motion they hold their Figma frame.
 */

type Screen = "explore-4" | "explore-6" | "final-sell" | "final-delivery";

// ── tickets ────────────────────────────────────────────────────────────────────────────────
const NOTCHED =
  "M42 34.8174C41.9426 34.8127 41.8845 34.8105 41.8262 34.8105C40.3886 34.8107 39.2229 36.2534 39.2227 38.0332C39.2227 39.8132 40.3885 41.2567 41.8262 41.2568C41.8845 41.2568 41.9426 41.2537 42 41.249V52.001H0V41.249C1.35681 41.1384 2.42969 39.7411 2.42969 38.0332C2.42948 36.3255 1.35672 34.928 0 34.8174V0H42V34.8174Z";
const ROUNDED =
  "M38 0C40.2091 0 42 1.79086 42 4V34.8164C41.9426 34.8117 41.8845 34.8096 41.8262 34.8096C40.3886 34.8097 39.2229 36.2525 39.2227 38.0322C39.2227 39.8122 40.3885 41.2557 41.8262 41.2559C41.8845 41.2559 41.9426 41.2527 42 41.248V48C41.9997 50.2089 40.209 52 38 52H4C1.79086 52 0 50.2082 0 47.999V41.248C1.35681 41.1374 2.42969 39.7401 2.42969 38.0322C2.42948 36.3246 1.35672 34.927 0 34.8164V3.99902C0.000263735 1.79011 1.79102 4.02797e-08 4 0H38Z";

const GRADS = {
  blue: ["#0056FF", "#003499"],
  purple: ["#6F00FF", "#330099"],
  magenta: ["#C300E6", "#640070"],
} as const;
type Hue = keyof typeof GRADS;

/** the exploration's gradient ticket, number in the middle */
function Ticket({ hue = "blue", n, small }: { hue?: Hue; n: number | string; small?: boolean }) {
  const id = useId();
  const [a, b] = GRADS[hue];
  return (
    <span className={`${styles.ticket} ${small ? styles.ticketSm : ""}`}>
      <svg viewBox="0 0 42 52" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="21" y1="0" x2="21" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        <path d={NOTCHED} fill={`url(#${id})`} />
      </svg>
      <span className={styles.ticketNum}>{n}</span>
    </span>
  );
}

/** the final design's outlined ticket (blue, or orange for the odd one out) */
function OutlineTicket({ orange }: { orange?: boolean }) {
  const id = useId();
  return (
    <span className={styles.oTicket}>
      <svg viewBox="0 0 42 52" aria-hidden="true">
        <defs>
          <clipPath id={id}>
            <path d={ROUNDED} />
          </clipPath>
        </defs>
        <path d={ROUNDED} fill={orange ? "#331100" : "#041F99"} fillOpacity="0.64" />
        {/* a 1px stroke inside the outline: a 2px stroke clipped to the shape */}
        <path
          d={ROUNDED}
          fill="none"
          stroke={orange ? "#FE5600" : "#002CFF"}
          strokeWidth="2"
          clipPath={`url(#${id})`}
        />
      </svg>
    </span>
  );
}

const Radio = ({ on }: { on?: boolean }) => (
  <svg className={styles.radio} viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7.5" fill="none" stroke={on ? "#385CFF" : "#ADADAD"} />
    <circle className={styles.radioDot} cx="8" cy="8" r="5" fill="#385CFF" style={{ opacity: on ? 1 : 0 }} />
  </svg>
);

/** loop helper: runs `play` while the element is on screen, unless motion is reduced */
function useLoop(play: (at: (ms: number, fn: () => void) => void) => number, reset: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reset();
      return;
    }
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const run = () => {
      const total = play(at);
      at(total, run);
    };
    run();
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return ref;
}

// ── exploration screens ───────────────────────────────────────────────────────────────────
const BATCHED: { label: string; caption: string; hues: (Hue | "|")[] }[] = [
  {
    label: "1 batch",
    caption: "Sell as one batch of six tickets, transfer 1x on Ticketmaster",
    hues: ["blue", "blue", "blue", "blue", "blue", "blue"],
  },
  {
    label: "2 batches",
    caption: "Sell as two batches of three tickets, transfer 2x on Ticketmaster",
    hues: ["blue", "blue", "blue", "|", "purple", "purple", "purple"],
  },
  {
    label: "3 batches",
    caption: "Sell as three batches of two tickets, transfer 3x on Ticketmaster",
    hues: ["blue", "blue", "|", "purple", "purple", "|", "magenta", "magenta"],
  },
];

function Option({
  label,
  caption,
  on,
  tap,
  children,
}: {
  label: string;
  caption: string;
  on: boolean;
  tap?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.option} ${on ? styles.optionOn : ""}`}>
      <div className={styles.optionHead}>
        <span className={styles.radioWrap}>
          <Radio on={on} />
          {/* the "tap" — a soft ring that blooms out of the radio when it's picked */}
          {tap ? <span key={tap} className={styles.tapRing} aria-hidden="true" /> : null}
        </span>
        <span className={styles.optionLabel}>{label}</span>
      </div>
      {children}
      <p className={styles.caption}>{caption}</p>
    </div>
  );
}

function BatchedRow({ hues, first }: { hues: (Hue | "|")[]; first?: boolean }) {
  let i = 0;
  return (
    <div className={styles.row}>
      {hues.map((h, k) =>
        h === "|" ? (
          <span key={k} className={styles.divider} aria-hidden="true" />
        ) : (
          <Ticket key={k} hue={h} n={first ? ++i : 1} />
        ),
      )}
    </div>
  );
}

/** a custom batch's row: − on the left, + on the right, its tickets centred between */
const STEP = 32.219 + 6.137; // ticket + gap, Figma px
const rowX = (count: number, i: number) => (324 - (count * 32.219 + (count - 1) * 6.137)) / 2 + i * STEP;

function Explore4() {
  // 0..3 = which option is picked; the Figma frame shows custom (3)
  const [sel, setSel] = useState(3);
  const [tap, setTap] = useState(0);
  const ref = useLoop(
    (at) => {
      const HOLD = 1700;
      [0, 1, 2, 3].forEach((k, i) =>
        at(i * HOLD + 400, () => {
          setSel(k);
          setTap((t) => t + 1);
        }),
      );
      return 4 * HOLD + 400;
    },
    () => setSel(3),
  );
  return (
    <div ref={ref} className={`${styles.phone} ${styles.explore}`} style={{ height: "calc(873 * var(--pu))" }}>
      <p className={styles.qty}>Ticket Quantity Selected: 4</p>
      <p className={styles.desc}>
        You’re able to batch these tickets to sell them independently of each other. You will need to
        transfer these batches when you sell your tickets.
      </p>
      <p className={styles.ask}>How do you want to batch your tickets?</p>
      {BATCHED.map((o, k) => (
        <Option key={o.label} label={o.label} caption={o.caption} on={sel === k} tap={sel === k ? tap : 0}>
          <BatchedRow hues={o.hues} first={k === 0} />
        </Option>
      ))}
      <Option label="Custom batching" caption="add batch" on={sel === 3} tap={sel === 3 ? tap : 0}>
        <p className={styles.caption}>Sell your tickets the way you want to</p>
        <div className={styles.batches} style={{ height: "calc(68 * var(--pu))" }}>
          <p className={styles.batchLabel}>Batch 1</p>
          <div className={styles.stepper}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={styles.slot} style={{ transform: `translateX(calc(${rowX(6, i)} * var(--pu)))` }}>
                <Ticket small n={i + 1} />
              </span>
            ))}
            <span className={`${styles.stepBtn} ${styles.minus}`}>-</span>
            <span className={`${styles.stepBtn} ${styles.plus}`}>+</span>
          </div>
        </div>
      </Option>
    </div>
  );
}

function Explore6() {
  // how many of the six tickets are in batch 1 (the rest are in batch 2); Figma shows 5 / 1
  const [n1, setN1] = useState(5);
  const [press, setPress] = useState<{ btn: "plus" | "minus"; k: number } | null>(null);
  const ref = useLoop(
    (at) => {
      // + twice (5/1 → 4/2 → 3/3), hold, then − twice back to 5/1
      const seq: [number, "plus" | "minus", number][] = [
        [900, "plus", 4],
        [2100, "plus", 3],
        [4300, "minus", 4],
        [5500, "minus", 5],
      ];
      seq.forEach(([t, btn, next], k) => {
        at(t, () => setPress({ btn, k }));
        at(t + 140, () => setN1(next));
      });
      return 7400;
    },
    () => {
      setN1(5);
      setPress(null);
    },
  );
  const n2 = 6 - n1;
  // ticket id i: batch 1 while i < n1 (left to right), otherwise batch 2 (in order)
  const pos = (i: number) =>
    i < n1 ? { x: rowX(n1, i), y: 0, n: i + 1 } : { x: rowX(n2, i - n1), y: 68, n: i - n1 + 1 };
  return (
    <div ref={ref} className={`${styles.phone} ${styles.explore6}`} style={{ height: "calc(872 * var(--pu))" }}>
      <p className={styles.qty}>Ticket Quantity Selected: 6</p>
      <p className={styles.desc}>
        You’re able to batch these tickets to sell them independently of each other. You will need to
        transfer these batches when you sell your tickets.
      </p>
      <p className={styles.ask}>How do you want to batch your tickets?</p>
      {BATCHED.map((o) => (
        <Option key={o.label} label={o.label} caption={o.caption} on={false}>
          <BatchedRow hues={o.hues} first={o.label === "1 batch"} />
        </Option>
      ))}
      <Option label="Custom batching" caption="add batch" on>
        <p className={styles.caption}>Sell your tickets the way you want to</p>
        <div className={styles.batches} style={{ height: "calc(136 * var(--pu))" }}>
          <p className={styles.batchLabel}>Batch 1</p>
          <p className={styles.batchLabel} style={{ top: "calc(68 * var(--pu))" }}>
            Batch 2
          </p>
          {[0, 68].map((y) => (
            <div key={y} className={styles.stepper} style={{ top: `calc(${28 + y} * var(--pu))` }}>
              <span
                key={press && y === 68 && press.btn === "minus" ? `m${press.k}` : "m"}
                className={`${styles.stepBtn} ${styles.minus} ${press && y === 68 && press.btn === "minus" ? styles.pressed : ""}`}
              >
                -
              </span>
              <span
                key={press && y === 68 && press.btn === "plus" ? `p${press.k}` : "p"}
                className={`${styles.stepBtn} ${styles.plus} ${press && y === 68 && press.btn === "plus" ? styles.pressed : ""}`}
              >
                +
              </span>
            </div>
          ))}
          {/* all six tickets live in one layer so one can travel from batch 1 down into batch 2 */}
          <div className={styles.ticketLayer}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const p = pos(i);
              return (
                <span
                  key={i}
                  className={`${styles.slot} ${styles.moving}`}
                  style={{ transform: `translate(calc(${p.x} * var(--pu)), calc(${p.y} * var(--pu)))` }}
                >
                  <Ticket small n={p.n} />
                </span>
              );
            })}
          </div>
        </div>
      </Option>
    </div>
  );
}

// ── final design screens (static) ─────────────────────────────────────────────────────────
function FinalChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.phone} ${styles.final}`}>
      <svg className={styles.close} viewBox="0 0 22 22" aria-hidden="true">
        <path d="M16.08 5.36L5.36 16.08M5.36 5.36l10.72 10.72" stroke="#F2F2F2" strokeWidth="1.787" strokeLinecap="round" />
      </svg>
      <div className={styles.event}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.artist} src="/projects/crowdvolt/tm-artist.webp" alt="" width={172} height={172} />
        <div className={styles.eventText}>
          <p className={styles.eventName}>Black Coffee</p>
          <p className={styles.eventMeta}>Sun, January 11 • 10PM</p>
          <p className={styles.eventMeta}>Zamna</p>
        </div>
        <div className={styles.timer}>
          <svg viewBox="0 0 61 61" aria-hidden="true">
            {Array.from({ length: 30 }, (_, i) => {
              const a = (i / 30) * Math.PI * 2;
              const r1 = 25.7;
              const r2 = 24;
              const c = 30.016;
              return (
                <line
                  key={i}
                  x1={c + Math.sin(a) * r1}
                  y1={c - Math.cos(a) * r1}
                  x2={c + Math.sin(a) * r2}
                  y2={c - Math.cos(a) * r2}
                  stroke="white"
                  strokeWidth="1.715"
                  strokeLinecap="round"
                  opacity={i === 0 ? 0.3 : 1}
                />
              );
            })}
          </svg>
          <span>4:51</span>
        </div>
      </div>
      <div className={styles.progress} aria-hidden="true">
        <span />
      </div>
      <div className={styles.tabs}>
        <span>Tickets</span>
        <span className={styles.tabOn}>Transfer</span>
        <span>Review</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.badge} src="/projects/crowdvolt/tm-badge.webp" alt="" width={191} height={117} />
      <div className={styles.finalBody}>{children}</div>
    </div>
  );
}

function FinalSell() {
  return (
    <FinalChrome>
      <p className={styles.finalTitle}>How do you want to sell your tickets?</p>
      <div className={styles.fOption}>
        <div className={styles.optionHead}>
          <Radio />
          <span className={styles.optionLabel}>Default</span>
        </div>
        <div className={`${styles.fRow} ${styles.fRowSplit}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={styles.fCell}>
              {i ? <span className={styles.fDivider} aria-hidden="true" /> : null}
              <OutlineTicket />
            </span>
          ))}
        </div>
        <p className={styles.caption}>Anyone can buy any amount of tickets</p>
      </div>
      <div className={`${styles.fOption} ${styles.fOptionLight}`}>
        <div className={styles.optionHead}>
          <Radio />
          <span className={styles.optionLabel}>Don’t leave me with one ticket</span>
        </div>
        <div className={styles.fRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OutlineTicket key={i} orange={i === 5} />
          ))}
        </div>
        <p className={styles.caption}>Auto-groups so you’re never left with one ticket</p>
      </div>
      <div className={styles.fOption}>
        <div className={styles.optionHead}>
          <Radio />
          <span className={styles.optionLabel}>All or nothing</span>
        </div>
        <div className={`${styles.fRow} ${styles.fRowTight}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OutlineTicket key={i} />
          ))}
        </div>
        <p className={styles.caption}>Buyer can only take all tickets at once</p>
      </div>
    </FinalChrome>
  );
}

function FinalDelivery() {
  return (
    <FinalChrome>
      <p className={styles.finalTitle}>Ticket Delivery</p>
      <div className={styles.delivery}>
        <OutlineTicket />
      </div>
      <p className={styles.deliveryNote}>
        <b>You’ll transfer your ticket to us on Ticketmaster</b> in the final steps before going live.{" "}
        <b>Your ticket stays in your account until it sells. Once sold, we’ll handle the transfer.</b>
      </p>
    </FinalChrome>
  );
}

const SCREENS: Record<Screen, { el: () => React.ReactElement; label: string }> = {
  "explore-4": {
    el: Explore4,
    label:
      "Early batching screen: choose 1 batch, 2 batches, 3 batches or custom batching for your tickets",
  },
  "explore-6": {
    el: Explore6,
    label: "Custom batching: tickets moved between batch 1 and batch 2 with plus and minus buttons",
  },
  "final-sell": {
    el: FinalSell,
    label:
      "Final screen: How do you want to sell your tickets? Default, Don’t leave me with one ticket, or All or nothing",
  },
  "final-delivery": {
    el: FinalDelivery,
    label: "Final ticket delivery screen explaining the Ticketmaster transfer in plain language",
  },
};

export default function TicketmasterPhones({ screens }: { screens: Screen[] }) {
  return (
    <div className={styles.frame}>
      {screens.map((s) => {
        const { el: El, label } = SCREENS[s];
        return (
          <div key={s} role="img" aria-label={label}>
            <El />
          </div>
        );
      })}
    </div>
  );
}
