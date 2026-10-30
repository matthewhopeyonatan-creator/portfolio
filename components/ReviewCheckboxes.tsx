"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ReviewCheckboxes.module.css";

/**
 * CrowdVolt's review step with the bid warning as two checkboxes (Figma 295:2008). The page
 * behind is the screenshot; the popup itself is rebuilt in code (Figma 295:2889) so it stays sharp
 * when it's zoomed into. While it's on screen it loops: the whole screen, then an ease in on the
 * checkboxes, both get ticked (Place Offer lights up), a beat, then it eases back out and they
 * clear. Off screen it stops and starts over from the whole screen.
 */
type Step = "wide" | "zoom" | "one" | "two" | "out";

// how long each step lasts before the next (ms)
const TIMELINE: [Step, number][] = [
  ["wide", 1400],
  ["zoom", 1900], // the zoom itself takes 1600
  ["one", 650],
  ["two", 1600],
  ["out", 1700], // the zoom out takes 1400; the ticks clear once it's out
];

export default function ReviewCheckboxes({ alt }: { alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("wide");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t = 0;
    let i = 0;
    const run = () => {
      const [s, d] = TIMELINE[i];
      setStep(s);
      i = (i + 1) % TIMELINE.length;
      t = window.setTimeout(run, d);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(t);
        if (e.isIntersecting) {
          i = 0;
          run();
        } else setStep("wide");
      },
      { root: el.closest<HTMLElement>("[data-lenis-prevent]"), threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, []);

  const zoomed = step === "zoom" || step === "one" || step === "two";
  const first = step === "one" || step === "two" || step === "out";
  const second = step === "two" || step === "out";

  return (
    <div ref={ref} className={styles.window} role="img" aria-label={alt}>
      <div className={`${styles.stage} ${zoomed ? styles.zoomed : ""}`}>
        {/* the page behind the popup (the popup in it is covered by the one below) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.backdrop}
          src="/projects/crowdvolt/bid-checkbox.webp"
          alt=""
          width={1512}
          height={743}
          loading="lazy"
          decoding="async"
        />

        <div className={styles.modal} aria-hidden="true">
          {/* header */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.artist} src="/projects/crowdvolt/review-artist.webp" alt="" />
          <div className={styles.event}>Subtronics (Friday)</div>
          <div className={`${styles.meta} ${styles.date}`}>Fri, February 27 • 10PM</div>
          <div className={`${styles.meta} ${styles.venue}`}>Brooklyn Storehouse</div>
          <div className={styles.timer}>
            <svg viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="26" />
            </svg>
            <span>4:44</span>
          </div>
          <svg className={styles.close} viewBox="0 0 16 16">
            <path d="M12 4 4 12M4 4l8 8" />
          </svg>

          {/* progress + steps */}
          <div className={styles.progress}>
            <span />
          </div>
          <div className={styles.tab} style={{ left: "5.48%" }}>Tickets</div>
          <div className={styles.tab} style={{ left: "31.04%" }}>Delivery</div>
          <div className={styles.tab} style={{ left: "57.56%" }}>Payment</div>
          <div className={`${styles.tab} ${styles.tabOn}`} style={{ left: "85.28%" }}>Review</div>

          <div className={styles.heading}>Confirm Order</div>

          <div className={styles.row} style={{ top: "calc(224 * var(--f))" }}>
            <div className={styles.label}>Your Bid</div>
            <div className={styles.value}>1x General Admission $3</div>
          </div>
          <div className={styles.row} style={{ top: "calc(297 * var(--f))" }}>
            <div className={styles.label}>Delivery</div>
            <div className={styles.value}>Mobile transfer</div>
          </div>
          <div
            className={styles.row}
            style={{ top: "calc(370 * var(--f))", height: "calc(64.8 * var(--f))" }}
          >
            <div className={styles.label}>Payment</div>
            <div className={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/projects/crowdvolt/review-visa.webp" alt="" />
              <span>**** 2374</span>
            </div>
          </div>

          <div className={`${styles.bold} ${styles.subtotal}`}>Subtotal</div>
          <svg className={styles.chevron} viewBox="0 0 13 8">
            <path d="M1 7l5.5-5.5L12 7" />
          </svg>
          <div className={`${styles.bold} ${styles.total}`}>
            <span>Order Total</span>
            <span>$3.00</span>
          </div>

          <Box on={first} top={534} />
          <div className={styles.terms} style={{ top: "calc(532 * var(--f))" }}>
            I accept the <u>Terms of Service</u> and <u>Privacy Policy</u>
          </div>
          <Box on={second} top={562} />
          <div className={styles.terms} style={{ top: "calc(562 * var(--f))", left: "calc(65 * var(--f))" }}>
            I understand that this offer is final and binding
          </div>

          {/* footer */}
          <div className={styles.footRule} />
          <span className={styles.back}>Back</span>
          <span className={`${styles.place} ${first && second ? styles.placeOn : ""}`}>
            <svg viewBox="0 0 15 15">
              <rect x="3" y="6.5" width="9" height="6.5" rx="1.2" />
              <path d="M5 6.5V4.8a2.5 2.5 0 0 1 5 0v1.7" />
            </svg>
            Place Offer
          </span>
        </div>
      </div>
    </div>
  );
}

function Box({ on, top }: { on: boolean; top: number }) {
  return (
    <span
      className={`${styles.box} ${on ? styles.boxOn : ""}`}
      style={{ top: `calc(${top} * var(--f))` }}
    >
      <svg viewBox="0 0 20 20">
        <path d="M5.5 10.5l3 3 6-7" />
      </svg>
    </span>
  );
}
