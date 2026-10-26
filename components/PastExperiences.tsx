"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { pastExperiences } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./PastExperiences.module.css";

type Experience = (typeof pastExperiences)[number];

/**
 * Past experiences (Figma 141:151): the section title (same as the others, centred), then every
 * role as a row under a 2px rule — dates on the left, the role on the right with the company large
 * beneath it — in two columns. Hovering a company name (mouse only) brings up its card (Figma
 * 141:165) just below-right of the cursor, following it while you stay on the name.
 */
export default function PastExperiences() {
  const [hovered, setHovered] = useState<Experience | null>(null);
  const card = useFollowCard(hovered);

  return (
    <section
      id="past-experiences"
      aria-labelledby="past-experiences-title"
      className={styles.section}
    >
      <h2
        id="past-experiences-title"
        className={`${pageStyles.sectionTitle} ${styles.title}`}
        data-reveal="up"
      >
        Past experiences
      </h2>
      <ul className={styles.list}>
        {pastExperiences.map((x) => (
          // "ledger" entrance (globals.css): the rule draws across, then the line is written in
          <li
            key={x.org}
            className={`${styles.item} ${x.blurb ? styles.hasCard : ""}`}
            data-reveal="ledger"
            data-reveal-early
          >
            <span className={styles.dates}>{x.dates}</span>
            <span className={styles.role}>{x.role}</span>
            {/* only the company name opens its card */}
            <span
              className={styles.org}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse" || !x.blurb) return;
                card.place(e.clientX, e.clientY, true);
                setHovered(x);
              }}
              onPointerMove={(e) => {
                if (e.pointerType === "mouse" && x.blurb) card.place(e.clientX, e.clientY);
              }}
              onPointerLeave={() => setHovered(null)}
            >
              {x.org}
            </span>
            {x.blurb ? <span className="visually-hidden">{x.blurb}</span> : null}
          </li>
        ))}
      </ul>
      {card.mounted
        ? createPortal(
            <div ref={card.ref} className={styles.hoverCard} aria-hidden="true">
              <div className={`${styles.card} ${hovered ? styles.cardOn : ""}`}>
                {card.shown ? (
                  <>
                    <Image
                      src={card.shown.logo}
                      alt=""
                      width={140}
                      height={140}
                      className={styles.cardLogo}
                    />
                    <p className={styles.cardText}>{card.shown.blurb}</p>
                  </>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

const OFFSET = 18; // px below-right of the cursor tip
const EASE = 0.22; // share of the gap to the cursor closed each frame — a soft, quick follow

/**
 * The card follows the cursor with a light lag (it eases toward the pointer each frame instead of
 * being nailed to it). Position goes straight onto the element's transform — no re-renders. It
 * flips to the cursor's left / top when it would run off the window.
 */
function useFollowCard(hovered: Experience | null) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // keeps the last card's content while it fades out
  const [shown, setShown] = useState<Experience | null>(null);
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
