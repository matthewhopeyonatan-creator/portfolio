"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cartCatalog } from "@/data/site";
import { useCart } from "./CartContext";
import styles from "./CartDrawer.module.css";

const CONTACT = "matthew.hope.yonatan@gmail.com";

/** Figma "Frame 25": the cart, sliding in from the right. */
export default function CartDrawer() {
  const { items, isOpen, close, setQty } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const lines = cartCatalog
    .filter((c) => items[c.key])
    .map((c) => ({ item: c, qty: items[c.key] }));

  // focus in/out, Esc to close, lock the page scroll while open
  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        // keep Tab inside the drawer
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href]",
        );
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
        lines
          .map((l) => `• ${l.item.name}${l.qty > 1 ? ` × ${l.qty}` : ""}`)
          .join("\n") +
        "\n\nLet's talk!",
    )}`;

  return (
    <div
      className={`${styles.root} ${isOpen ? styles.open : ""}`}
      aria-hidden={!isOpen}
    >
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
            <h2 id="cart-title" className="visually-hidden">
              Your cart
            </h2>
            {/* LED-style sign, like the footer: two identical runs slid left by one run, forever */}
            <div className={styles.marquee} aria-hidden="true">
              <div className={styles.track}>
                {[0, 1].map((run) => (
                  <span key={run} className={styles.run}>
                    <span className={styles.word}>your cart</span>
                    <span className={styles.word}>your cart</span>
                  </span>
                ))}
              </div>
            </div>
            {/* no visible close in the design — Esc / clicking outside close it; this shows on keyboard focus */}
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              onClick={close}
            >
              close
            </button>
          </header>

          {lines.length ? (
            <ul className={styles.list} data-lenis-prevent>
              {lines.map(({ item, qty }) => (
                <li key={item.key} className={styles.row}>
                  <div
                    className={`${styles.thumb} ${item.sticker ? styles.thumbSticker : ""}`}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" />
                    ) : null}
                  </div>
                  <div className={styles.details}>
                    <p className={styles.name}>{item.name}</p>
                    <div className={styles.qty}>
                      <button
                        type="button"
                        className={styles.step}
                        onClick={() => setQty(item.key, qty - 1)}
                        aria-label={
                          qty > 1
                            ? `One less ${item.name}`
                            : `Remove ${item.name}`
                        }
                      >
                        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
                          <path
                            d="M9 18H27"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <span
                        className={styles.count}
                        aria-label={`Quantity ${qty}`}
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        className={styles.step}
                        onClick={() => setQty(item.key, qty + 1)}
                        aria-label={`One more ${item.name}`}
                      >
                        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
                          <path
                            d="M9 18H27M18 27V9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
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
              <p className={styles.emptyHint}>Start viewing projects</p>
            </div>
          )}

          <div className={styles.foot}>
            {lines.length ? (
              <a className={styles.checkout} href={checkoutHref}>
                checkout
              </a>
            ) : (
              <Link
                className={styles.checkout}
                href="/#seasonal-picks"
                onClick={close}
              >
                start shopping
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
