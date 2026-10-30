"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { navLinks } from "@/data/site";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./MenuDrawer.module.css";

/** SiteHeader's menu button (phones) opens the menu with this event. */
export const openMenu = () => window.dispatchEvent(new Event("menu:open"));

/**
 * Phones: the navbar's menu (the three lines). A sheet like the cart's — sliding in from the right
 * over a dimmed page, "MENU" running across its top — holding about, projects and the cart. The
 * links go where the navbar's do; "your cart" swaps this sheet for the cart.
 */
export default function MenuDrawer() {
  const [isOpen, setOpen] = useState(false);
  const { open: openCart, count } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("menu:open", onOpen);
    return () => window.removeEventListener("menu:open", onOpen);
  }, []);

  // the menu is a phone thing: if the window grows past phone width, put it away
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => !mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // focus in/out, Esc to close, Tab kept inside, the page held still while it's open
  useEffect(() => {
    if (!isOpen) return;
    const last = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("button, a[href]");
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("cart-open");
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("cart-open");
      if (last?.matches?.(":focus-visible")) last.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <div className={`${styles.root} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen}>
      <div className={styles.backdrop} onClick={close} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        inert={!isOpen}
      >
        <div className={styles.inner}>
          <header className={styles.head}>
            <h2 id="menu-title" className="visually-hidden">
              Menu
            </h2>
            {/* the cart's caps sign, standing still here */}
            <p className={styles.word} aria-hidden="true">
              menu
            </p>
            {/* like the cart: tap outside or Esc closes it; this one shows on keyboard focus */}
            <button ref={closeRef} type="button" className={styles.close} onClick={close}>
              close
            </button>
          </header>

          <ul className={styles.list}>
            {navLinks.map((link, i) => (
              <li key={link.label} className={styles.row} style={{ "--i": i } as React.CSSProperties}>
                <Link
                  href={link.href}
                  className={styles.item}
                  onClick={(e) => {
                    close();
                    // over an open case study: it closes first, then goes there itself
                    if (document.querySelector("[data-overlay-nav]")) {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent("overlay:navigate", { detail: link.href }));
                    }
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className={styles.row} style={{ "--i": navLinks.length } as React.CSSProperties}>
              <button
                type="button"
                className={styles.item}
                onClick={() => {
                  setOpen(false);
                  openCart();
                }}
              >
                <span>
                  your cart{count ? <span className={styles.count}> ({count})</span> : null}
                </span>
              </button>
            </li>
          </ul>

          {/* phones: the light / dark switch lives here, in the sheet's lower right corner */}
          <ThemeToggle className={styles.toggle} />
        </div>
      </div>
    </div>
  );
}
