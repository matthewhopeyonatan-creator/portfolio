"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { grocersSelects } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./GrocersSelects.module.css";

/**
 * Grocer's Selects (Figma 111:697): the graphics shelf. Title row like Seasonal Picks, then the
 * screen split into three equal columns by 2px ink rules that run edge to edge and meet; each
 * poster sits with the same space on all four sides, its name and price under it.
 */
export default function GrocersSelects() {
  const gridRef = useRef<HTMLUListElement>(null);

  // Each poster swipes in only once its art has loaded (no half-drawn image mid-animation), and
  // the moving posters only play while they're on screen.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const figs = Array.from(grid.querySelectorAll<HTMLElement>("figure"));
    const cleanups: (() => void)[] = [];
    for (const fig of figs) {
      const done = () => (fig.dataset.loaded = "");
      const img = fig.querySelector("img");
      const video = fig.querySelector("video");
      if (img) {
        if (img.complete && img.naturalWidth) done();
        else {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }
      } else if (video) {
        // the still is shown as the video's poster until it plays: wait for that still
        const still = new window.Image();
        still.onload = still.onerror = done;
        still.src = video.poster;
      }
      const t = window.setTimeout(done, 2500); // never hold a poster back for long
      cleanups.push(() => window.clearTimeout(t));
    }
    const videos = Array.from(grid.querySelectorAll("video"));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        v.muted = true; // autoplay is only allowed muted (React doesn't always set the property)
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }
    });
    videos.forEach((v) => io.observe(v));
    return () => {
      cleanups.forEach((c) => c());
      io.disconnect();
    };
  }, []);

  return (
    <section id="grocers-selects" aria-labelledby="grocers-selects-title">
      <div className={`${pageStyles.sectionTitleRow} ${styles.titleRow}`}>
        <h2
          id="grocers-selects-title"
          className={pageStyles.sectionTitle}
          data-reveal="up"
        >
          Grocer’s selects
        </h2>
      </div>
      <div>
        <ul ref={gridRef} className={styles.grid}>
          {grocersSelects.map((item) => (
            <li key={item.src} className={styles.cell}>
              {/* each row rolls up together */}
              <figure className={styles.item} data-reveal="swipe">
                {/* the poster's slot: it comes into focus here on entrance (globals.css) */}
                <span className={styles.frame} data-slot>
                {item.video ? (
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
                    <source
                      src={item.video.replace(/\.mp4$/, ".webm")}
                      type="video/webm"
                    />
                    <source src={item.video} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={item.src}
                    alt={`${item.title} — ${item.source}`}
                    width={742}
                    height={988}
                    sizes="(max-width: 767px) 80vw, 22vw"
                    loading="eager"
                    className={styles.poster}
                  />
                )}
                </span>
                <figcaption className={styles.caption}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.price}>{item.price}</span>
                  <span className={styles.source}>{item.source}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
