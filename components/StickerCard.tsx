"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./StickerCard.module.css";

export type CardSticker = {
  src: string;
  /** hero size, design px — the card shows it at the same relative scale as Figma's Jakarta */
  w: number;
  h: number;
  label: string;
  /** card heading (placeholder until the real copy is in) */
  title?: string;
  story?: string;
  /** extra room from the photo's top-left corner on the card, design px (default 5, 3) */
  inset?: [number, number];
  /** the three notes along the bottom of the card */
  lessons?: string[];
  /** photos for the image box; more than one becomes a carousel */
  photos?: (string | { src: string; focus: string })[];
};

// Figma 45:95: the Jakarta sticker is 256 wide on the tomato and 162 on the card
const CARD_SCALE = 162.47 / 256.16;

const PLACEHOLDER =
  "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.”";

/** Story text: "[words](https://…)" becomes a link (opens in a new tab). */
function withLinks(text: string) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    parts.push(text.slice(last, m.index));
    parts.push(
      <a
        key={m.index}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {m[1]}
      </a>,
    );
    last = (m.index ?? 0) + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

/**
 * The card's photo box: each photo fills it (cropped, never stretched). With several, a new one
 * slides in from the right every 1.7 seconds, the old one sliding out to the left, on a loop.
 */
function Photos({
  srcs,
}: {
  srcs: (string | { src: string; focus: string })[];
}) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (srcs.length < 2) return;
    const id = window.setInterval(
      () => setAt((i) => (i + 1) % srcs.length),
      1700,
    );
    return () => window.clearInterval(id);
  }, [srcs.length]);
  const prev = (at - 1 + srcs.length) % srcs.length;
  return (
    <>
      {srcs.map((photo, i) => {
        const src = typeof photo === "string" ? photo : photo.src;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            style={
              typeof photo === "string"
                ? undefined
                : { objectPosition: photo.focus }
            }
            className={`${styles.photo} ${i === at ? styles.photoOn : i === prev && srcs.length > 1 ? styles.photoOff : ""}`}
          />
        );
      })}
    </>
  );
}

/** Tells SmoothScroll to pause / resume the page while the card is up. */
const lockScroll = (on: boolean) => {
  document.documentElement.classList.toggle("modal-open", on);
  window.dispatchEvent(new CustomEvent("scroll-lock", { detail: on }));
};

/**
 * Sticker story card (Figma 45:95). The clicked sticker lifts off its tomato and flies into the
 * card's upper-left corner; closing flies it back onto the tomato.
 */
export default function StickerCard({
  sticker,
  origin,
  onClosed,
}: {
  sticker: CardSticker;
  origin: HTMLElement;
  onClosed: () => void;
}) {
  const [phase, setPhase] = useState<"in" | "open" | "out">("in");
  const flyRef = useRef<HTMLImageElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // animate the flying copy from one box to another (centre to centre, scaled to fit)
  const fly = useCallback((from: DOMRect, to: DOMRect, back: boolean) => {
    const el = flyRef.current!;
    Object.assign(el.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
    });
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const k = to.width / from.width;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    return el.animate(
      [
        { transform: "translate(0px, 0px) scale(1) rotate(0deg)" },
        {
          // lifted off the surface halfway: a touch bigger, tilted
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) scale(${((1 + k) / 2) * 1.1}) rotate(${back ? 5 : -7}deg)`,
          offset: 0.45,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(0deg)` },
      ],
      {
        // flying home is a little quicker than flying out
        duration: reduce ? 1 : back ? 600 : 760,
        easing: "cubic-bezier(0.3, 0.7, 0.2, 1)", // --ease-peel
        fill: "forwards",
      },
    ).finished;
  }, []);

  // fly in
  useLayoutEffect(() => {
    lockScroll(true);
    const from = origin.getBoundingClientRect();
    const to = slotRef.current!.getBoundingClientRect();
    let alive = true;
    fly(from, to, false).then(() => alive && setPhase("open"));
    frameRef.current?.focus({ preventScroll: true });
    return () => {
      alive = false;
    };
  }, [fly, origin]);

  const close = useCallback(() => {
    if (phase === "out") return;
    setPhase("out");
    const from = slotRef.current!.getBoundingClientRect();
    const to = origin.getBoundingClientRect();
    fly(from, to, true).then(() => {
      lockScroll(false);
      onClosed(); // Hero shows the sticker again and hands focus back to it
    });
  }, [fly, onClosed, origin, phase]);

  // Esc closes; Tab stays inside the card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        // cycle between the close button and any links in the story
        e.preventDefault();
        const stops = [
          closeRef.current,
          ...(cardRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []),
        ].filter(Boolean) as HTMLElement[];
        const at = stops.indexOf(document.activeElement as HTMLElement);
        const next = (at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length;
        stops[next]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => () => lockScroll(false), []);

  return createPortal(
    <div
      className={`${styles.overlay} ${phase === "out" ? styles.leaving : ""}`}
    >
      <div className={styles.backdrop} onClick={close} aria-hidden="true" />
      <div
        ref={frameRef}
        tabIndex={-1}
        className={styles.frame}
        role="dialog"
        aria-modal="true"
        aria-label={sticker.label}
        style={
          {
            "--sw": sticker.w * CARD_SCALE,
            "--sh": sticker.h * CARD_SCALE,
            "--ox": sticker.inset?.[0],
            "--oy": sticker.inset?.[1],
          } as React.CSSProperties
        }
      >
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={close}
        >
          close
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </button>
        <div ref={cardRef} className={styles.card}>
          <div className={styles.media} aria-hidden="true">
            {sticker.photos?.length ? <Photos srcs={sticker.photos} /> : null}
          </div>
          {/* the sticker's resting place on the card */}
          <div
            ref={slotRef}
            className={`${styles.slot} ${phase === "open" ? styles.slotOn : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sticker.src} alt="" draggable={false} />
          </div>
          <div className={styles.copy}>
            <h2 className={styles.title}>{sticker.title ?? "Title"}</h2>
            <div className={styles.text}>
              {/* a blank line in the story starts a new paragraph */}
              {(sticker.story ?? PLACEHOLDER)
                .split(/\n\s*\n/)
                .map((para, i) => (
                  <p key={i}>{withLinks(para)}</p>
                ))}
            </div>
          </div>
          <ol className={styles.lessons}>
            {(sticker.lessons ?? ["Lesson 1", "Lesson 2", "Lesson 3"]).map(
              (lesson, i) => (
                <li key={i} className={styles.lesson}>
                  <span className={styles.lessonNum}>[{i + 1}]</span>
                  <span>{lesson}</span>
                </li>
              ),
            )}
          </ol>
        </div>
      </div>
      {/* the copy that flies between the tomato and the card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={flyRef}
        className={`${styles.flyer} ${phase === "open" ? styles.flyerParked : ""}`}
        src={sticker.src}
        alt=""
        draggable={false}
        aria-hidden="true"
      />
    </div>,
    document.body,
  );
}
