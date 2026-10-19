"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Lenis from "lenis";
import { caseStudySections, type Project } from "@/data/site";
import { caseStudies, type CaseBlock } from "@/data/caseStudies";
import SiteHeader from "@/components/SiteHeader";
import styles from "./ProjectOverlay.module.css";

const LOREM =
  "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.”";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Tells SmoothScroll to pause / resume the page while the popup is up. */
const lockScroll = (on: boolean) => {
  document.documentElement.classList.toggle("modal-open", on);
  window.dispatchEvent(new CustomEvent("scroll-lock", { detail: on }));
};

/** One piece of a case study (see data/caseStudies.ts). */
function Block({ b }: { b: CaseBlock }) {
  const pic = (im: { src: string; w: number; h: number; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={im.src}
      alt={im.alt}
      width={im.w}
      height={im.h}
      loading="lazy"
      decoding="async"
      className={styles.csImg}
    />
  );
  switch (b.type) {
    case "h":
      return <h3 className={styles.sectionTitle}>{b.text}</h3>;
    case "sub":
      return <h4 className={styles.csSub}>{b.text}</h4>;
    case "kicker":
      return <p className={styles.csKicker}>{b.text}</p>;
    case "lead":
      return <p className={styles.csLead}>{b.text}</p>;
    case "p":
      return <p>{b.text}</p>;
    case "list":
      return (
        <ul className={styles.csList}>
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    case "chips":
      return (
        <ul className={styles.csChips}>
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    case "img":
      return <figure className={styles.csFigure}>{pic(b.image)}</figure>;
    case "row":
      return (
        <div className={styles.csRow}>
          {b.images.map((im) => (
            <figure key={im.src} className={styles.csFigure}>
              {pic(im)}
            </figure>
          ))}
        </div>
      );
    case "logos":
      return (
        <div className={styles.csLogos}>
          {b.images.map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={im.src}
              src={im.src}
              alt={im.alt}
              width={im.w}
              height={im.h}
            />
          ))}
        </div>
      );
    case "cards":
      return (
        <div className={styles.csCards}>
          {b.items.map((c) => (
            <div key={c.title} className={styles.csCard}>
              {c.image ? pic(c.image) : null}
              <p className={styles.csCardTitle}>{c.title}</p>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      );
    case "link":
      return (
        <a
          className={styles.more}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {b.text}
        </a>
      );
  }
}

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
  const innerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // smooth (inertial) scrolling inside the popup too, same feel as the page
  useEffect(() => {
    const wrapper = frameRef.current;
    const content = innerRef.current;
    if (!wrapper || !content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ wrapper, content, autoRaf: true, lerp: 0.09 });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Full screen counts as its own page: it gets a history entry, so the browser's back button
  // returns to the main page. `pushed` = that entry is ours and still on top.
  const pushed = useRef(false);

  // `then` runs once the popup is gone and the page can scroll again
  const close = useCallback(
    (then?: () => void) => {
      if (leaving) return;
      if (pushed.current) {
        pushed.current = false;
        history.back(); // drop our "page" too; popstate is ignored now that pushed is false
      }
      setLeaving(true);
      window.setTimeout(() => {
        lockScroll(false);
        onClose();
        if (then) requestAnimationFrame(() => requestAnimationFrame(then));
      }, 380);
    },
    [leaving, onClose],
  );

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

  useEffect(() => {
    if (!expanded || pushed.current) return;
    history.pushState(
      { ...(history.state ?? {}), projectPage: project.slug },
      "",
      `?project=${project.slug}`,
    );
    pushed.current = true;
  }, [expanded, project.slug]);

  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false; // the browser already left our entry
      close();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
        at = sectionRefs.current.length - 1;
      setActive(at);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [expanded]);

  const toggle = () => {
    if (expanded) {
      lenisRef.current?.scrollTo(0, { immediate: true });
      frameRef.current?.scrollTo({ top: 0 });
    }
    setExpanded((x) => !x);
  };

  const jump = (i: number) => {
    const root = frameRef.current;
    const el = sectionRefs.current[i];
    if (!root || !el) return;
    const header = root.querySelector<HTMLElement>("header")?.offsetHeight ?? 0;
    const top =
      root.scrollTop +
      el.getBoundingClientRect().top -
      root.getBoundingClientRect().top -
      header -
      24;
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.2 });
    else root.scrollTo({ top, behavior: "smooth" });
  };

  // the project's real case study when there is one, otherwise placeholder sections
  const study = caseStudies[project.slug];
  const sectionNames = study ? study.map((sec) => sec.name) : caseStudySections;

  const f = project.facts;
  const facts: [string, string][] = [
    ["Timeline", f?.timeline ?? "TBD"],
    ["Role", f?.role ?? "TBD"],
    ["Project Type", f?.type ?? "TBD"],
    ["Team", f?.team ?? "TBD"],
  ];

  return createPortal(
    <div className={`${styles.overlay} ${leaving ? styles.leaving : ""}`}>
      <div
        className={styles.backdrop}
        onClick={() => close()}
        aria-hidden="true"
      />
      <div
        ref={frameRef}
        className={`${styles.frame} ${expanded ? styles.expanded : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        tabIndex={-1}
        data-lenis-prevent
      >
        {/* single content child for the popup's own smooth scroller */}
        <div ref={innerRef}>
          {expanded ? (
            // full screen reads as the next page: the site's own navbar sits on top. Following any
            // of its links leaves the case study; the cart opens over it.
            <div
              className={styles.siteNav}
              data-overlay-nav
              onClickCapture={(e) => {
                const a = (e.target as HTMLElement).closest("a");
                if (!a) return;
                const href = a.getAttribute("href") ?? "";
                if (
                  /^https?:/.test(href) ||
                  e.metaKey ||
                  e.ctrlKey ||
                  e.shiftKey
                ) {
                  close(); // leaving the site: just get out of the way
                  return;
                }
                // in-page links (the logo, "projects") can't move the page while it's locked
                // under the popup: close first, then go there
                e.preventDefault();
                e.stopPropagation();
                close(() => {
                  if (href.startsWith("#")) {
                    const t = document.createElement("a");
                    t.href = href;
                    document.body.appendChild(t);
                    t.click(); // SmoothScroll glides to the section
                    t.remove();
                  } else {
                    const ask = new CustomEvent("scroll-to-top", {
                      detail: { handled: false },
                    });
                    window.dispatchEvent(ask);
                    if (!ask.detail.handled)
                      window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                });
              }}
            >
              <SiteHeader />
            </div>
          ) : (
            <header className={styles.header}>
              <span className={styles.logo}>
                <b>Nutrition Facts</b>
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
              <button
                type="button"
                className={styles.close}
                onClick={() => close()}
              >
                Close
              </button>
            </header>
          )}

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
            <div className={styles.hero} aria-hidden="true">
              {project.video ? (
                <video autoPlay muted loop playsInline preload="auto">
                  <source
                    src={project.video.replace(/\.mp4$/, ".webm")}
                    type="video/webm"
                  />
                  <source src={project.video} type="video/mp4" />
                </video>
              ) : null}
            </div>
          </section>

          {/* full case study — scrolls in the card too; the tracker only shows full screen */}
          <div className={styles.study}>
            {expanded && (
              <nav className={styles.toc} aria-label="On this page">
                {/* Figma 64:591 "Aisle Directory": [n] markers, serif names, the current one larger in red */}
                <p className={styles.tocLabel}>Aisle Directory</p>
                <ol>
                  {sectionNames.map((name, i) => (
                    <li key={name} className={styles.tocRow}>
                      <span className={styles.tocNum} aria-hidden="true">
                        [{i + 1}]
                      </span>
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
            )}
            <div className={styles.sections}>
              {sectionNames.map((name, i) => (
                <section
                  key={name}
                  id={`${project.slug}-${slugify(name)}`}
                  ref={(el) => {
                    sectionRefs.current[i] = el;
                  }}
                  className={styles.section}
                >
                  {study && (
                    <p className={styles.sectionLabel}>
                      <span aria-hidden="true">[{i + 1}]</span> {name}
                    </p>
                  )}
                  {study ? (
                    study[i].blocks.map((b, j) => <Block key={j} b={b} />)
                  ) : (
                    <>
                      <h3 className={styles.sectionTitle}>{name}</h3>
                      <p>{LOREM}</p>
                      <div className={styles.shot} aria-hidden="true" />
                      <p>{LOREM}</p>
                    </>
                  )}
                </section>
              ))}
              {!study && (
                <a
                  className={styles.more}
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the current case study ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
