"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { catalogAisles } from "@/data/site";
import ThemedPair from "@/components/ThemedPair";
import { useTheme } from "@/lib/theme";
import styles from "./Catalog.module.css";

type Aisle = (typeof catalogAisles)[number];
type Slug = Aisle["slug"];
const previewOf = (a: Aisle) => ("preview" in a ? a.preview : undefined);
const isSlug = (s: string): s is Slug =>
  catalogAisles.some((a) => a.slug === s);

/**
 * Catalog page (Figma 122:925): the aisles listed down the left over two blurred tomatoes. Each
 * one opens a boxed popup (not full screen) whose contents scroll inside it. The open aisle lives
 * in the URL hash, so /catalog#graphics lands with the Graphics popup already up.
 */
export default function Catalog() {
  const dark = useTheme() === "dark";
  const [open, setOpen] = useState<Slug | null>(null);
  const preview = useHoverPreview();

  // follow the hash (initial load, back/forward, links from elsewhere on the site)
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      setOpen(isSlug(h) ? h : null);
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    // "catalog" in the navbar/footer while a popup is open: back to the plain catalog
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href="/catalog"]');
      if (a) setOpen(null);
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
      document.removeEventListener("click", onClick);
    };
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
          <div className={`${styles.tomatoRot} theme-pair`}>
            <ThemedPair
              light="/catalog/tomato-4.svg"
              dark="/catalog/dark/tomato-4.svg"
              render={(v) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={v.className}
                  ref={v.imgRef}
                  src={v.src}
                  alt=""
                  width={1344}
                  height={1291}
                  onLoad={v.onLoad}
                  data-ready={v.ready ? "" : undefined}
                  className={v.className}
                />
              )}
            />
          </div>
        </div>
        <div className={`${styles.tomato} ${styles.tomatoFront}`}>
          <div className={`${styles.tomatoRot} theme-pair`}>
            <ThemedPair
              light="/catalog/tomato-5.svg"
              dark="/catalog/dark/tomato-5.svg"
              render={(v) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={v.className}
                  ref={v.imgRef}
                  src={v.src}
                  alt=""
                  width={1520}
                  height={1455}
                  onLoad={v.onLoad}
                  data-ready={v.ready ? "" : undefined}
                  className={v.className}
                />
              )}
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
                preview.hide();
                show(a.slug);
              }}
              onPointerEnter={(e) => preview.enter(e, a.slug)}
              onPointerMove={preview.move}
              onPointerLeave={preview.hide}
              aria-haspopup="dialog"
            >
              <span>{a.label}</span>
              {/* two arrows: on hover the first flies off up-right and the second follows in */}
              <span className={styles.arrow} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/catalog/${dark ? "dark/" : ""}arrow.svg`} alt="" width={31} height={31} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/catalog/${dark ? "dark/" : ""}arrow.svg`} alt="" width={31} height={31} />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* the aisle's picture, riding just right of the cursor (mouse only) */}
      <div ref={preview.ref} className={styles.preview} aria-hidden="true">
        <div className={styles.previewCard}>
          {catalogAisles.map((a) => {
            const src = previewOf(a);
            return src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={a.slug}
                src={src}
                alt=""
                data-slug={a.slug}
                width={450}
                height={253}
              />
            ) : null;
          })}
        </div>
      </div>

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

/**
 * The hover preview: one card that trails the cursor with a little ease (a lerp each frame, so it
 * glides rather than sticks), fades/scales in when the pointer reaches an aisle that has a
 * picture, swaps pictures with a crossfade between aisles, and fades out when it leaves.
 */
function useHoverPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, on: false });

  const place = () => {
    const el = ref.current;
    if (el)
      el.style.transform = `translate3d(${s.current.x}px, ${s.current.y}px, 0)`;
  };
  const tick = () => {
    const st = s.current;
    const k = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 0.18;
    st.x += (st.tx - st.x) * k;
    st.y += (st.ty - st.y) * k;
    place();
    const still = Math.abs(st.tx - st.x) < 0.1 && Math.abs(st.ty - st.y) < 0.1;
    st.raf = still && !st.on ? 0 : requestAnimationFrame(tick);
  };

  const enter = (e: React.PointerEvent, slug: Slug) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const has = !!el.querySelector(`img[data-slug="${slug}"]`);
    el.querySelectorAll("img").forEach((im) =>
      im.toggleAttribute("data-on", im.dataset.slug === slug),
    );
    const st = s.current;
    st.tx = e.clientX;
    st.ty = e.clientY;
    if (!el.hasAttribute("data-show")) {
      // arriving from nowhere: start right at the cursor
      st.x = st.tx;
      st.y = st.ty;
      place();
    }
    el.toggleAttribute("data-show", has);
    st.on = has;
    if (has && !st.raf) st.raf = requestAnimationFrame(tick);
  };
  const move = (e: React.PointerEvent) => {
    s.current.tx = e.clientX;
    s.current.ty = e.clientY;
  };
  const hide = useCallback(() => {
    s.current.on = false;
    ref.current?.removeAttribute("data-show");
  }, []);

  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);
  return { ref, enter, move, hide };
}

function AislePopup({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return onClose();
    setLeaving(true);
    window.setTimeout(onClose, 240);
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
      <div
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aisle-title"
      >
        <header className={styles.popupHead}>
          <h2 id="aisle-title" className={styles.popupTitle}>
            {label}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.popupClose}
            onClick={close}
          >
            close
          </button>
        </header>
        <div className={styles.popupBody} data-lenis-prevent>
          <p className={styles.stocking}>
            Stocking the shelves — check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}
