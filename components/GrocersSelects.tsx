"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { grocersSelects } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./GrocersSelects.module.css";

/**
 * Grocer's Selects: the graphics shelf as a stack of posters in depth, running on a diagonal
 * from near (bottom left) to far (top right), each turned away at an angle. Scrolling through the
 * section glides the stack along it — the posters come forward one at a time and leave past the
 * bottom left. Hovering a poster turns it flat to face you (display only: no click).
 * With reduced motion it's the plain four-across grid instead.
 */

const N = grocersSelects.length;
const NEAR = -1.8; // posters this far in front of the current one have gone (faded out by here)
const FAR = 8; // ...and this far behind it haven't come in yet

function Poster({ item }: { item: (typeof grocersSelects)[number] }) {
  return item.video ? (
    <video
      className={styles.poster}
      poster={item.src}
      width={742}
      height={988}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={`${item.title} — ${item.source}`}
    >
      <source src={item.video.replace(/\.mp4$/, ".webm")} type="video/webm" />
      <source src={item.video} type="video/mp4" />
    </video>
  ) : (
    <Image
      src={item.src}
      alt={`${item.title} — ${item.source}`}
      width={742}
      height={988}
      sizes="(max-width: 767px) 60vw, 26vw"
      loading="eager"
      className={styles.poster}
    />
  );
}

export default function GrocersSelects() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // the stack: each poster's place along the diagonal follows the scroll
  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    let raf = 0;
    let W = 0;
    let H = 0;

    const measure = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
    };
    const draw = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const run = r.height - H;
      const t = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      const p = t * (N - 1);
      // one step along the diagonal: right and up across the window, smaller with distance
      const phone = W < 768;
      const sx = W * (phone ? 0.1 : 0.062);
      const sy = H * (phone ? 0.05 : 0.055);
      cards.current.forEach((el, i) => {
        if (!el) return;
        const d = i - p;
        // once past the front a poster speeds up and slides off the bottom left, fading as it goes
        const m = d < 0 ? d * 2.4 : d;
        const s = Math.max(0.35, 1 - m * 0.045);
        const fade = d < 0 ? (d - NEAR) / (-NEAR - 0.8) : (FAR - d) / 2;
        const o = Math.min(1, Math.max(0, fade));
        el.style.transform = `translate3d(${(m * sx).toFixed(2)}px, ${(-m * sy).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o > 0 ? "visible" : "hidden";
      });
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      measure();
      ask();
    };
    measure();
    draw();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  // the moving posters only play while the shelf is on screen
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        v.muted = true; // autoplay is only allowed muted (React doesn't always set the property)
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }
    });
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section id="grocers-selects" aria-labelledby="grocers-selects-title">
      <div className={`${pageStyles.sectionTitleRow} ${styles.titleRow}`}>
        <h2 id="grocers-selects-title" className={pageStyles.sectionTitle} data-reveal="up">
          Grocer’s selects
        </h2>
      </div>
      {reduced ? (
        <div ref={sectionRef}>
          <ul className={styles.grid}>
            {grocersSelects.map((item) => (
              <li key={item.src} className={styles.cell}>
                <Poster item={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          ref={sectionRef}
          className={styles.run}
          style={{ ["--n" as string]: N }}
        >
          <div ref={stageRef} className={styles.stage}>
            <ul className={styles.stack}>
              {grocersSelects.map((item, i) => (
                <li
                  key={item.src}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className={styles.card}
                  style={{ zIndex: N - i }}
                >
                  <figure className={styles.turn}>
                    <Poster item={item} />
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
