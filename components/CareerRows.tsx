"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./About.module.css";

export type CareerRow = {
  org: string;
  role: string;
  dates: string;
  blurb?: string;
  logo?: string;
};

/**
 * The about page's experience / education rows (Figma 217:490, 217:516). Pointing at a company or
 * school name (mouse only) brings up its card — the same one the homepage's experience list had
 * (Figma 141:165): logo and a line about the place, just below-right of the cursor, trailing it
 * while you stay on the name. Rows without a blurb get no card; one without a logo shows just the
 * line.
 */
export default function CareerRows({ items, className }: { items: CareerRow[]; className: string }) {
  const [hovered, setHovered] = useState<CareerRow | null>(null);
  const card = useFollowCard(hovered);

  return (
    <>
      <ul className={`${styles.rows} ${className}`}>
        {items.map((r, i) => (
          <li
            key={r.org}
            className={styles.row}
            data-reveal="up"
            // starts just before it's on screen, the rows close behind each other, so the list is
            // there to read as it arrives
            data-reveal-early="ahead"
            style={{ "--i": i * 0.5 } as React.CSSProperties}
          >
            <span
              className={`${styles.org} ${r.blurb ? styles.hasCard : ""}`}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse" || !r.blurb) return;
                card.place(e.clientX, e.clientY, true);
                setHovered(r);
              }}
              onPointerMove={(e) => {
                if (e.pointerType === "mouse" && r.blurb) card.place(e.clientX, e.clientY);
              }}
              onPointerLeave={() => setHovered(null)}
            >
              {r.org}
            </span>
            <span className={styles.role}>{r.role}</span>
            <span className={styles.dates}>{r.dates}</span>
            {r.blurb ? <span className="visually-hidden">{r.blurb}</span> : null}
          </li>
        ))}
      </ul>
      {card.mounted
        ? createPortal(
            <div ref={card.ref} className={styles.hoverCard} aria-hidden="true">
              <div
                className={`${styles.card} ${hovered ? styles.cardOn : ""} ${
                  card.shown && !card.shown.logo ? styles.cardTextOnly : ""
                }`}
              >
                {card.shown ? (
                  <>
                    {card.shown.logo ? (
                      <Image
                        src={card.shown.logo}
                        alt=""
                        width={140}
                        height={140}
                        className={styles.cardLogo}
                        loading="eager"
                      />
                    ) : null}
                    <p className={styles.cardText}>{card.shown.blurb}</p>
                  </>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

const OFFSET = 18; // px below-right of the cursor tip
const EASE = 0.22; // share of the gap to the cursor closed each frame — a soft, quick follow

/**
 * The card follows the cursor with a light lag (it eases toward the pointer each frame instead of
 * being nailed to it). Position goes straight onto the element's transform — no re-renders. It
 * flips to the cursor's left / top when it would run off the window.
 */
function useFollowCard(hovered: CareerRow | null) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // keeps the last card's content while it fades out
  const [shown, setShown] = useState<CareerRow | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (hovered) setShown(hovered);
  }, [hovered]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const write = () => {
    const el = ref.current;
    if (el) el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
  };

  const tick = () => {
    const p = pos.current;
    const t = target.current;
    p.x += (t.x - p.x) * EASE;
    p.y += (t.y - p.y) * EASE;
    write();
    raf.current =
      Math.abs(t.x - p.x) > 0.1 || Math.abs(t.y - p.y) > 0.1 ? requestAnimationFrame(tick) : 0;
  };

  const place = (cx: number, cy: number, jump = false) => {
    const el = ref.current;
    const w = el?.offsetWidth || 386;
    const h = el?.offsetHeight || 181;
    let x = cx + OFFSET;
    let y = cy + OFFSET;
    if (x + w > window.innerWidth - 16) x = cx - OFFSET - w;
    if (y + h > window.innerHeight - 16) y = cy - OFFSET - h;
    target.current = { x, y };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (jump || reduce) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      pos.current = { x, y };
      write();
    } else if (!raf.current) {
      raf.current = requestAnimationFrame(tick);
    }
  };

  return { ref, mounted, shown, place };
}
