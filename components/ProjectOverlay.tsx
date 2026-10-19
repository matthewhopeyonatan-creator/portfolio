"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { caseStudySections, type Project } from "@/data/site";
import styles from "./ProjectOverlay.module.css";

const LOREM =
  "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.”";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Tells SmoothScroll to pause / resume the page while the popup is up. */
const lockScroll = (on: boolean) => {
  document.documentElement.classList.toggle("modal-open", on);
  window.dispatchEvent(new CustomEvent("scroll-lock", { detail: on }));
};

function ExpandIcon({ expanded }: { expanded: boolean }) {
  // four corner arrows: pointing out to expand, pointing in to shrink back
  const out =
    "M3 3h9M3 3v9M3 3l10 10 M35 3h-9M35 3v9M35 3L25 13 M3 35h9M3 35v-9M3 35l10-10 M35 35h-9M35 35v-9M35 35L25 25";
  const inn =
    "M13 13H4M13 13V4M13 13L3 3 M25 13h9M25 13V4M25 13L35 3 M13 25H4M13 25v9M13 25L3 35 M25 25h9M25 25v9M25 25l10 10";
  return (
    <svg viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <path d={expanded ? inn : out} stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/**
 * Project popup (Figma 64:317). Opens over the page as a card with the project's title section;
 * the corner button expands it to fill the screen, revealing the full case study with an
 * "On this page" tracker on the left. Esc / clicking outside closes it.
 */
export default function ProjectOverlay({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  // phones get the whole case study straight away (the popup is a full-screen sheet there)
  const [expanded, setExpanded] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const [leaving, setLeaving] = useState(false);
  const [active, setActive] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const close = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      lockScroll(false);
      onClose();
    }, 380);
  }, [leaving, onClose]);

  useEffect(() => {
    lockScroll(true);
    frameRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [close]);

  // tracker: the section nearest the top of the view is the active one
  useEffect(() => {
    const root = frameRef.current;
    if (!expanded || !root) return;
    const onScroll = () => {
      const top = root.getBoundingClientRect().top + root.clientHeight * 0.35;
      let at = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= top) at = i;
      });
      // at the very bottom, the last section wins
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4)
        at = caseStudySections.length - 1;
      setActive(at);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [expanded]);

  const toggle = () => {
    if (expanded) frameRef.current?.scrollTo({ top: 0 });
    setExpanded((x) => !x);
  };

  const jump = (i: number) => {
    const root = frameRef.current;
    const el = sectionRefs.current[i];
    if (!root || !el) return;
    const header =
      root.querySelector<HTMLElement>(`.${styles.header}`)?.offsetHeight ?? 0;
    const top = root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - header - 24;
    root.scrollTo({ top, behavior: "smooth" });
  };

  const f = project.facts;
  const facts: [string, string][] = [
    ["Timeline", f?.timeline ?? "TBD"],
    ["Role", f?.role ?? "TBD"],
    ["Project Type", f?.type ?? "TBD"],
    ["Team", f?.team ?? "TBD"],
  ];

  return createPortal(
    <div className={`${styles.overlay} ${leaving ? styles.leaving : ""}`}>
      <div className={styles.backdrop} onClick={close} aria-hidden="true" />
      <div
        ref={frameRef}
        className={`${styles.frame} ${expanded ? styles.expanded : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        tabIndex={-1}
        data-lenis-prevent
      >
        <header className={styles.header}>
          <span className={styles.logo} aria-hidden="true">
            <b>hope</b>
            <span className={styles.apos}>’</span>
            <b>s grocer</b>
          </span>
          <button
            type="button"
            className={styles.expand}
            onClick={toggle}
            aria-label={
              expanded ? "Shrink back to a card" : "Expand to full screen"
            }
            aria-pressed={expanded}
          >
            <ExpandIcon expanded={expanded} />
          </button>
          <button type="button" className={styles.close} onClick={close}>
            Close
          </button>
        </header>

        {/* title section — Figma: title 40 SemiBold, intro Light 24/25 (487 wide), four facts; image 860×532 r24 */}
        <section className={styles.intro}>
          <div className={styles.introText}>
            <h2 className={styles.title}>{project.title}</h2>
            <p className={styles.lead}>{project.intro ?? LOREM}</p>
            <dl className={styles.facts}>
              {facts.map(([k, v]) => (
                <div key={k} className={styles.fact}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={styles.hero} aria-hidden="true" />
        </section>

        {/* full case study — only shown when expanded */}
        {expanded && (
          <div className={styles.study}>
            <nav className={styles.toc} aria-label="On this page">
              <p className={styles.tocLabel}>On this page</p>
              <ol>
                {caseStudySections.map((name, i) => (
                  <li key={name}>
                    <button
                      type="button"
                      className={`${styles.tocItem} ${i === active ? styles.tocOn : ""}`}
                      aria-current={i === active ? "true" : undefined}
                      onClick={() => jump(i)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            <div className={styles.sections}>
              {caseStudySections.map((name, i) => (
                <section
                  key={name}
                  id={`${project.slug}-${slugify(name)}`}
                  ref={(el) => {
                    sectionRefs.current[i] = el;
                  }}
                  className={styles.section}
                >
                  <h3 className={styles.sectionTitle}>{name}</h3>
                  <p>{LOREM}</p>
                  <div className={styles.shot} aria-hidden="true" />
                  <p>{LOREM}</p>
                </section>
              ))}
              <a
                className={styles.more}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the current case study ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
