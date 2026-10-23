"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { catalogAisles } from "@/data/site";
import styles from "./Catalog.module.css";

type Slug = (typeof catalogAisles)[number]["slug"];
const isSlug = (s: string): s is Slug => catalogAisles.some((a) => a.slug === s);

/**
 * Catalog page (Figma 122:925): the aisles listed down the left over two blurred tomatoes. Each
 * one opens a boxed popup (not full screen) whose contents scroll inside it. The open aisle lives
 * in the URL hash, so /catalog#graphics lands with the Graphics popup already up.
 */
export default function Catalog() {
  const [open, setOpen] = useState<Slug | null>(null);

  // follow the hash (initial load, back/forward, links from elsewhere on the site)
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      setOpen(isSlug(h) ? h : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const show = (slug: Slug) => {
    history.pushState(null, "", `#${slug}`);
    setOpen(slug);
  };
  const close = useCallback(() => {
    history.pushState(null, "", window.location.pathname);
    setOpen(null);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.tomatoes} aria-hidden="true">
        <div className={`${styles.tomato} ${styles.tomatoBack}`}>
          <div className={styles.tomatoRot}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/catalog/tomato-4.svg" alt="" width={1344} height={1291} />
            <span
              className="tomato-noise"
              aria-hidden="true"
              style={{ maskImage: "url(/catalog/tomato-4.svg)", WebkitMaskImage: "url(/catalog/tomato-4.svg)" }}
            />
          </div>
        </div>
        <div className={`${styles.tomato} ${styles.tomatoFront}`}>
          <div className={styles.tomatoRot}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/catalog/tomato-5.svg" alt="" width={1520} height={1455} />
            <span
              className="tomato-noise"
              aria-hidden="true"
              style={{ maskImage: "url(/catalog/tomato-5.svg)", WebkitMaskImage: "url(/catalog/tomato-5.svg)" }}
            />
          </div>
        </div>
      </div>

      <h1 className="visually-hidden">Catalog</h1>
      <ul className={styles.aisles}>
        {catalogAisles.map((a, i) => (
          <li key={a.slug} style={{ "--i": i } as React.CSSProperties}>
            <a
              href={`#${a.slug}`}
              className={styles.aisle}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // not a scroll-to-section link
                show(a.slug);
              }}
              aria-haspopup="dialog"
            >
              <span>{a.label}</span>
              {/* two arrows: on hover the first flies off up-right and the second follows in */}
              <span className={styles.arrow} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/catalog/arrow.svg" alt="" width={31} height={31} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/catalog/arrow.svg" alt="" width={31} height={31} />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {open ? (
        <AislePopup
          key={open}
          label={catalogAisles.find((a) => a.slug === open)!.label}
          onClose={close}
        />
      ) : null}
    </main>
  );
}

function AislePopup({ label, onClose }: { label: string; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    setLeaving(true);
    window.setTimeout(onClose, 260);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("scroll-lock", { detail: true }));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.dispatchEvent(new CustomEvent("scroll-lock", { detail: false }));
    };
  }, [close]);

  return (
    <div className={`${styles.popupRoot} ${leaving ? styles.leaving : ""}`}>
      <div className={styles.backdrop} onClick={close} />
      <div className={styles.popup} role="dialog" aria-modal="true" aria-labelledby="aisle-title">
        <header className={styles.popupHead}>
          <h2 id="aisle-title" className={styles.popupTitle}>
            {label}
          </h2>
          <button ref={closeRef} type="button" className={styles.popupClose} onClick={close}>
            close
          </button>
        </header>
        <div className={styles.popupBody} data-lenis-prevent>
          <p className={styles.stocking}>Stocking the shelves — check back soon.</p>
        </div>
      </div>
    </div>
  );
}
