"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { grocersSelects } from "@/data/site";
import styles from "./GrocersSelects.module.css";

/**
 * Grocer's Selects: the graphics shelf. No title, no rules: one row of posters as tall as the
 * window (40 above and below). On reaching it the row pins in place and scrolling slides it right
 * to left; once the last poster reaches the right margin the page scrolls on down to the footer.
 * Phones keep a plain vertical stack.
 */
export default function GrocersSelects() {
  const shelfRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  // Vertical scroll → horizontal slide. The section is made as tall as the window plus however
  // far the row has to travel; while it's pinned, every pixel scrolled down moves the row one
  // pixel left.
  useEffect(() => {
    const shelf = shelfRef.current;
    const pin = pinRef.current;
    const grid = gridRef.current;
    if (!shelf || !pin || !grid) return;
    const wide = window.matchMedia("(min-width: 768px)");
    let travel = 0;
    let frame = 0;

    const place = () => {
      frame = 0;
      if (!wide.matches) return;
      const y = Math.min(travel, Math.max(0, -shelf.getBoundingClientRect().top));
      grid.style.transform = `translate3d(${-y}px, 0, 0)`;
    };
    const measure = () => {
      if (!wide.matches) {
        shelf.style.height = "";
        grid.style.transform = "";
        return;
      }
      travel = Math.max(0, grid.scrollWidth - pin.clientWidth);
      shelf.style.height = `${pin.clientHeight + travel}px`;
      place();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pin);
    ro.observe(grid);
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", measure);
      cancelAnimationFrame(frame);
    };
  }, []);

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
    <section
      id="grocers-selects"
      ref={shelfRef}
      className={styles.shelf}
      aria-labelledby="grocers-selects-title"
    >
      {/* no title on the shelf: the name stays for screen readers only */}
      <h2 id="grocers-selects-title" className="visually-hidden">
        Grocer’s selects
      </h2>
      <div ref={pinRef} className={styles.pin}>
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
                    sizes="(max-width: 767px) 90vw, 70vh"
                    loading="eager"
                    className={styles.poster}
                  />
                )}
                </span>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
