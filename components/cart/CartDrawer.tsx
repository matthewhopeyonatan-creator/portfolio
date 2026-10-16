"use client";

import { useEffect, useRef } from "react";
import { projects } from "@/data/site";
import { useCart } from "./CartContext";
import styles from "./CartDrawer.module.css";

const CONTACT = "matthew.hope.yonatan@gmail.com";

/** Figma "Frame 25": the cart, sliding in from the right. */
export default function CartDrawer() {
  const { items, isOpen, close, setQty } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const lines = projects.filter((p) => items[p.slug]).map((p) => ({ project: p, qty: items[p.slug] }));

  // focus in/out, Esc to close, lock the page scroll while open
  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        // keep Tab inside the drawer
        const f = panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("cart-open");
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("cart-open");
      lastFocus.current?.focus?.();
    };
  }, [isOpen, close]);

  const checkoutHref =
    `mailto:${CONTACT}?subject=${encodeURIComponent("Checking out at hope’s grocer")}` +
    `&body=${encodeURIComponent(
      "Hi Matthew,\n\nI picked up:\n" +
        lines.map((l) => `• ${l.project.title}${l.qty > 1 ? ` × ${l.qty}` : ""}`).join("\n") +
        "\n\nLet's talk!",
    )}`;

  return (
    <div className={`${styles.root} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen}>
      <div className={styles.backdrop} onClick={close} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        inert={!isOpen}
      >
        <div className={styles.inner}>
          <header className={styles.head}>
            <h2 id="cart-title" className={styles.title}>
              Your Cart
            </h2>
            <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Close cart">
              <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M6 6L34 34M34 6L6 34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          {lines.length ? (
            <ul className={styles.list}>
              {lines.map(({ project, qty }) => (
                <li key={project.slug} className={styles.row}>
                  <div className={styles.thumb}>
                    {project.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.cover.src} alt="" />
                    ) : null}
                  </div>
                  <div className={styles.details}>
                    <p className={styles.name}>{project.title}</p>
                    <div className={styles.qty}>
                      <button
                        type="button"
                        className={styles.step}
                        onClick={() => setQty(project.slug, qty - 1)}
                        aria-label={qty > 1 ? `One less ${project.title}` : `Remove ${project.title}`}
                      >
                        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
                          <path d="M9 18H27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                      <span className={styles.count} aria-label={`Quantity ${qty}`}>
                        {qty}
                      </span>
                      <button
                        type="button"
                        className={styles.step}
                        onClick={() => setQty(project.slug, qty + 1)}
                        aria-label={`One more ${project.title}`}
                      >
                        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
                          <path d="M9 18H27M18 27V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>Your cart is empty.</p>
              <p className={styles.emptyHint}>Open a project from Seasonal picks and it’ll land here.</p>
            </div>
          )}

          <div className={styles.foot}>
            {lines.length ? (
              <a className={styles.checkout} href={checkoutHref}>
                checkout
              </a>
            ) : (
              <a className={styles.checkout} href="#seasonal-picks" onClick={close}>
                start shopping
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
