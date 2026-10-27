"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { grocersSelects, posterKey } from "@/data/site";
import { useCart } from "@/components/cart/CartContext";
import { addView } from "@/lib/visit";
import pageStyles from "@/app/page.module.css";
import styles from "./GrocersSelects.module.css";

/**
 * Grocer's Selects (Figma 111:697): the graphics shelf. Title row like Seasonal Picks, then the
 * screen split into three equal columns by 2px ink rules that run edge to edge and meet; each
 * poster sits with the same space on all four sides, its name and price under it.
 */
type Item = (typeof grocersSelects)[number];

export default function GrocersSelects() {
  const { add } = useCart();
  const [open, setOpen] = useState<{ item: Item; from: DOMRect } | null>(null);
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

  const pick = (item: Item, el: HTMLElement) => {
    add(posterKey(item.src));
    setOpen({ item, from: el.getBoundingClientRect() });
  };

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
      <div className={styles.shelf}>
        <ul ref={gridRef} className={styles.grid}>
          {grocersSelects.map((item) => (
            <li key={item.src} className={styles.cell}>
              {/* each row rolls up together */}
              <figure className={styles.item} data-reveal="swipe">
                {/* the whole poster is the button: opens it up close and adds it to the cart */}
                <button
                  type="button"
                  className={styles.pick}
                  onClick={(e) =>
                    pick(item, e.currentTarget.firstElementChild as HTMLElement)
                  }
                  aria-label={`View ${item.title} up close and add it to your cart`}
                >
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
                </button>
                <figcaption className={styles.caption}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.price}>{item.price}</span>
                  <span className={styles.source}>{item.source}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <p className={styles.more} data-reveal="up">
          <Link href="/catalog#graphics">See full catalog</Link>
        </p>
      </div>
      {open ? (
        <PosterView
          key={open.item.src}
          item={open.item}
          from={open.from}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}

/**
 * The close-up: the poster lifts out of its slot on the shelf and grows to fill the screen over
 * a dimmed page, then shrinks back into place when closed (Esc, the backdrop or "close").
 */
function PosterView({
  item,
  from,
  onClose,
}: {
  item: Item;
  from: DOMRect;
  onClose: () => void;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);
  const closing = useRef(false);

  // time spent looking at this poster up close, for the receipt's "most viewed"
  useEffect(() => {
    const opened = Date.now();
    return () => addView(item.title, Date.now() - opened);
  }, [item.title]);

  // transform that puts the big poster exactly over its shelf slot
  const fromTransform = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return "none";
    const to = el.getBoundingClientRect();
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  }, [from]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = fromTransform();
    el.getBoundingClientRect(); // commit the start position
    requestAnimationFrame(() => {
      el.style.transition = "";
      el.style.transform = "none";
      setShown(true);
    });
    closeRef.current?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("scroll-lock", { detail: true }));
    document.documentElement.classList.add("cart-open");
    return () => {
      window.dispatchEvent(new CustomEvent("scroll-lock", { detail: false }));
      document.documentElement.classList.remove("cart-open");
    };
  }, [fromTransform]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = mediaRef.current;
    setShown(false);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    // going back is quicker than coming out: the visitor's done looking
    el.style.transition = "transform 300ms var(--ease-out)";
    el.style.transform = fromTransform();
    el.addEventListener("transitionend", onClose, { once: true });
    window.setTimeout(onClose, 400); // in case transitionend never fires
  }, [fromTransform, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className={`${styles.view} ${shown ? styles.viewShown : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — ${item.source}`}
      data-lenis-prevent
    >
      <div className={styles.viewBackdrop} onClick={close} />
      <div className={styles.viewStage}>
        <div ref={mediaRef} className={styles.viewMedia} onClick={close}>
          {item.video ? (
            <video
              className={styles.viewPoster}
              poster={item.src}
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={item.video.replace(/\.mp4$/, ".webm")} type="video/webm" />
              <source src={item.video} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={item.src}
              alt=""
              width={742}
              height={988}
              sizes="70vh"
              priority
              className={styles.viewPoster}
            />
          )}
        </div>
        {/* screen readers still hear that it went in the cart */}
        <p className="visually-hidden" aria-live="polite">
          {item.title} added to your cart
        </p>
      </div>
      <button ref={closeRef} type="button" className={styles.viewClose} onClick={close}>
        close
      </button>
    </div>
  );
}
