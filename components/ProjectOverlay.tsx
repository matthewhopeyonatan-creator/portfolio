"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Lenis from "lenis";
import { caseStudySections, type Project } from "@/data/site";
import { caseStudies, type CaseBlock } from "@/data/caseStudies";
import SiteHeader from "@/components/SiteHeader";
import TicketmasterPhones from "@/components/TicketmasterPhones";
import { addView } from "@/lib/visit";
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
    case "group":
      return (
        <div className={styles.cvGroup}>
          {b.label ? (
            <p
              className={`${styles.cvLabel} ${b.accent ? styles.cvAccent : ""}`}
            >
              {b.label}
            </p>
          ) : null}
          {b.blocks.map((c, j) => (
            <Block key={j} b={c} />
          ))}
        </div>
      );
    case "callout":
      return (
        <div className={styles.cvText}>
          <p className={styles.cvCallout}>{b.text}</p>
          {b.body ? <p className={styles.cvBody}>{b.body}</p> : null}
        </div>
      );
    case "embed":
      return (
        <div className={styles.cvEmbed} style={{ aspectRatio: b.ratio }}>
          <iframe
            src={b.url}
            title={b.title}
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      );
    case "flow":
      return <Flow b={b} />;
    case "figures":
      return (
        <div className={styles.cvFigures} data-count={b.items.length}>
          {b.items.map((f) => (
            <figure key={f.image.src} className={styles.cvFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.image.src}
                alt={f.image.alt}
                width={f.image.w}
                height={f.image.h}
                loading="lazy"
                decoding="async"
              />
              {f.caption ? <figcaption>{f.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      );
    case "blockers":
      return (
        <div className={styles.cvBlockers}>
          {b.items.map((it) => (
            <div key={it.label} className={styles.cvBlocker}>
              <p className={styles.cvBlockerHead}>
                <b>{it.label}</b>
                <span>{it.title}</span>
              </p>
              <p className={styles.cvBlockerText} style={{ maxWidth: `calc(${it.w} * var(--pu))` }}>
                {it.text}
              </p>
            </div>
          ))}
        </div>
      );
    case "sketch":
      return (
        <figure className={styles.cvSketch}>
          <div className={styles.cvSketchRow}>
            {b.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.cvSketchImg}
                src={b.image.src}
                alt={b.image.alt}
                width={b.image.w}
                height={b.image.h}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className={`${styles.cvSketchImg} ${styles.cvSketchEmpty}`} aria-hidden="true" />
            )}
            <div className={styles.cvSketchCards}>
              {b.items.map((it) => (
                <div key={it.title} className={styles.cvSketchCard}>
                  <p className={styles.cvSketchTitle}>{it.title}</p>
                  <p className={styles.cvSketchText}>{it.text}</p>
                </div>
              ))}
            </div>
          </div>
          <figcaption>{b.caption}</figcaption>
        </figure>
      );
    case "phones":
      return <TicketmasterPhones screens={b.screens} />;
    case "placeholder":
      return (
        <>
          <p>{LOREM}</p>
          <div className={styles.shot} aria-hidden="true" />
        </>
      );
  }
}

/**
 * Step diagram. With `skip`, it plays on a loop: every dot starts as a black outline, then they
 * fill in one after another (black), and a skipped step fills red instead — so the flow reads as
 * steps where that one gets jumped over. Holds a beat, resets, repeats. With `loop` and nothing
 * skipped, the ball simply carries left to right through every stop.
 */
function Flow({ b }: { b: Extract<CaseBlock, { type: "flow" }> }) {
  const animated = !!b.skip?.length || !!b.loop;
  const n = b.steps.length;
  const ref = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // dot centres within the box, so the ball can travel between them
  const [centres, setCentres] = useState<{ x: number; y: number }[]>([]);
  const [size, setSize] = useState(0);
  // loop state: which dots are filled, where the ball is, which skipped dot is shaking it off
  const [filled, setFilled] = useState<number[]>(animated ? [] : b.steps.map((_, i) => i));
  const [ball, setBall] = useState<{ at: number; dur: number; on: boolean }>({ at: 0, dur: 0, on: false });
  const [rejecting, setRejecting] = useState<number[]>([]);
  const [rejectKey, setRejectKey] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!animated || !el) return;
    // layout offsets, not screen rects: the popup scales in, and a rect taken mid-animation
    // would put the stops in the wrong place
    const measure = () => {
      setCentres(
        dotRefs.current.map((d) => {
          if (!d) return { x: 0, y: 0 };
          const step = d.offsetParent as HTMLElement | null; // the column (position: relative)
          return {
            x: (step?.offsetLeft ?? 0) + d.offsetLeft + d.offsetWidth / 2,
            y: (step?.offsetTop ?? 0) + d.offsetTop + d.offsetHeight / 2,
          };
        }),
      );
      setSize(dotRefs.current[0]?.offsetWidth ?? 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 }); // loops whenever it’s on screen
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [animated]);

  useEffect(() => {
    if (!animated) return;
    const skip = new Set(b.skip);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFilled(b.steps.map((_, i) => i).filter((i) => !skip.has(i)));
      setRejecting([...skip]);
      return;
    }
    setFilled([]);
    setRejecting([]);
    setBall({ at: 0, dur: 0, on: false });
    if (!inView) return;
    // the ball hops dot to dot; it sails straight over a skipped dot, which shakes it off
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const LEG = 380; // ms per dot of travel
    const run = () => {
      let t = 0;
      setFilled([]);
      setRejecting([]);
      // snap home while hidden (no travel back across the row), then fade in and go
      setBall({ at: 0, dur: 0, on: false });
      at(60, () => setBall({ at: 0, dur: 0, on: true }));
      t += 520;
      let i = 0;
      while (i < n - 1) {
        // travel to the next real stop, passing over any skipped dots
        let j = i + 1;
        while (j < n - 1 && skip.has(j)) j++;
        const legs = j - i;
        const dur = LEG * legs;
        const from = i;
        const to = j;
        // the dot it leaves stays filled behind it (filled as it departs, so the ball always
        // covers it while it's there)
        at(t, () => {
          setFilled((f) => [...f, from]);
          setBall({ at: to, dur, on: true });
        });
        for (let k = from + 1; k < to; k++) {
          const cross = t + (dur * (k - from)) / legs - 60;
          const kk = k;
          at(cross, () => {
            setRejecting((r) => [...r, kk]);
            setRejectKey((x) => x + 1);
          });
        }
        t += dur + 220;
        i = j;
      }
      // hold the finished row, then clear and go again
      at(t + 800, () => {
        setFilled((f) => [...f, n - 1]);
        setBall((bl) => ({ ...bl, on: false }));
      });
      at(t + 1150, () => {
        setFilled([]);
        setRejecting([]);
      });
      at(t + 1500, run);
    };
    run();
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [animated, inView, n, b.skip, b.steps]);

  // friction tags: a dark fill hops between them like it's weighing it up, slowing down until it
  // settles on the one that was chosen (the first), then replays
  const friction = b.frictionAfter ?? [];
  const deciding = friction.length > 1;
  const [fInView, setFInView] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!deciding || !el) return;
    const io = new IntersectionObserver(([e]) => setFInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [deciding]);
  useEffect(() => {
    if (!deciding) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPicked(friction[0]);
      setSettled(true);
      return;
    }
    setPicked(null);
    setSettled(false);
    if (!fInView) return;
    const timers: number[] = [];
    // hops between the two, each a little slower, ending on the first
    const gaps = [260, 300, 340, 400, 480, 580, 700];
    const run = () => {
      let t = 300;
      setSettled(false);
      gaps.forEach((g, i) => {
        t += g;
        const target = friction[(gaps.length - 1 - i) % 2 === 0 ? 0 : 1];
        timers.push(window.setTimeout(() => setPicked(target), t));
      });
      timers.push(window.setTimeout(() => setSettled(true), t + 120));
      timers.push(
        window.setTimeout(() => {
          setPicked(null);
          setSettled(false);
        }, t + 2200),
      );
      timers.push(window.setTimeout(run, t + 2700));
    };
    run();
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [deciding, fInView, friction]);

  const c = centres[ball.at];
  return (
    <div
      ref={ref}
      className={styles.cvFlow}
      data-count={n}
      role="img"
      aria-label={b.steps
        .map((s, i) => (b.skip?.includes(i) ? `${s} (skipped)` : s))
        .join(", then ")}
    >
      {b.steps.map((step, i) => {
        const on = filled.includes(i);
        const rejected = rejecting.includes(i);
        return (
          <div key={step} className={styles.cvStep}>
            <span className={styles.cvStepLabel}>{step}</span>
            <span
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              key={rejected ? `r${rejectKey}` : "d"}
              className={`${styles.cvDot} ${animated ? styles.cvDotRing : ""} ${
                animated && on ? styles.cvDotOn : ""
              } ${animated && rejected ? styles.cvDotReject : ""}`}
              aria-hidden="true"
            />
            {b.frictionAfter?.includes(i) ? (
              <span
                className={`${styles.cvFriction} ${picked === i ? styles.cvFrictionOn : ""} ${
                  picked === i && settled ? styles.cvFrictionSettled : ""
                }`}
                aria-hidden="true"
              >
                +FRICTION
              </span>
            ) : null}
          </div>
        );
      })}
      {animated && c && size ? (
        <span
          className={styles.cvBall}
          aria-hidden="true"
          style={{
            width: size,
            height: size,
            transform: `translate(${c.x - size / 2}px, ${c.y - size / 2}px) scale(${ball.on ? 1 : 0.6})`,
            opacity: ball.on ? 1 : 0,
            transition: `transform ${ball.dur}ms cubic-bezier(0.65, 0, 0.35, 1), opacity 300ms ease`,
          }}
        />
      ) : null}
    </div>
  );
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
  fromUrl = false,
}: {
  project: Project;
  onClose: () => void;
  /** reopened from ?project=… on a refresh: start full screen, on the current history entry */
  fromUrl?: boolean;
}) {
  // phones get the whole case study straight away (the popup is a full-screen sheet there)
  const [expanded, setExpanded] = useState(
    () =>
      fromUrl ||
      (typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches),
  );
  // opened from the address bar: the "page" entry already exists (it's the one we loaded on)
  const ownsUrl = useRef(fromUrl);
  // time spent in this case study, for the checkout receipt's "most viewed"
  useEffect(() => {
    const opened = Date.now();
    return () => addView(project.title, Date.now() - opened);
  }, [project.title]);
  const router = useRouter();
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
      } else if (ownsUrl.current) {
        // loaded straight onto the project: there's nothing to go back to, so just tidy the URL
        ownsUrl.current = false;
        history.replaceState(history.state, "", window.location.pathname);
      }
      setLeaving(true);
      window.setTimeout(() => {
        lockScroll(false);
        onClose();
        if (then) requestAnimationFrame(() => requestAnimationFrame(then));
      }, 240); // = --dur-exit
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
    if (ownsUrl.current) {
      // shrinking a project we loaded straight onto: it's no longer a "page"
      if (!expanded) {
        ownsUrl.current = false;
        history.replaceState(history.state, "", window.location.pathname);
      }
      return;
    }
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

  // card ⇄ full screen (FLIP): the layout switches in one go, then the frame is drawn back over
  // where it was and eased into place with transform + clip-path only — the case study inside
  // never re-lays out mid-move, so it stays smooth however long the page is.
  const flipFrom = useRef<DOMRect | null>(null);
  const toggle = () => {
    if (expanded) {
      lenisRef.current?.scrollTo(0, { immediate: true });
      frameRef.current?.scrollTo({ top: 0 });
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flipFrom.current = frameRef.current?.getBoundingClientRect() ?? null;
    }
    setExpanded((x) => !x);
  };

  useLayoutEffect(() => {
    const el = frameRef.current;
    const from = flipFrom.current;
    flipFrom.current = null;
    if (!el || !from) return;
    const to = el.getBoundingClientRect();
    if (!to.width || !to.height) return;
    // scale evenly (no squashing) so the new layout covers the old box, centre it on the old
    // box, and clip off the overhang
    const k = Math.max(from.width / to.width, from.height / to.height);
    const tx = from.left + from.width / 2 - (to.left + (to.width * k) / 2);
    const ty = from.top + from.height / 2 - (to.top + (to.height * k) / 2);
    const ix = (to.width * k - from.width) / (2 * k);
    const iy = (to.height * k - from.height) / (2 * k);
    el.animate(
      [
        {
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          clipPath: `inset(${iy}px ${ix}px)`,
        },
        { transformOrigin: "0 0", transform: "none", clipPath: "inset(0px 0px)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.77, 0, 0.175, 1)" }, // --ease-in-out
    );
  }, [expanded]);

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
                  // "/#section" or "#section": a section of the main page, glide to it
                  const hash = href.startsWith("/#") ? href.slice(1) : href.startsWith("#") ? href : "";
                  if (hash) {
                    const t = document.createElement("a");
                    t.href = hash;
                    document.body.appendChild(t);
                    t.click(); // SmoothScroll glides to the section
                    t.remove();
                  } else if (href === "/" || href === "") {
                    const ask = new CustomEvent("scroll-to-top", {
                      detail: { handled: false },
                    });
                    window.dispatchEvent(ask);
                    if (!ask.detail.handled)
                      window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    router.push(href); // another page of the site (e.g. the catalog)
                  }
                });
              }}
            >
              <SiteHeader />
            </div>
          ) : (
            <header className={styles.header}>
              <span className={styles.logo}>
                <b>{project.title} Nutrition Facts</b>
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
                  {study && study[i].blocks[0]?.type === "placeholder" && (
                    <p className={`${styles.cvLabel} ${styles.cvAccent}`}>
                      {name}
                    </p>
                  )}
                  {study &&
                    !study[i].ownLabel &&
                    study[i].blocks[0]?.type !== "placeholder" && (
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
