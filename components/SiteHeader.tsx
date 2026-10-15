"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cartLink, navLinks } from "@/data/site";
import styles from "./SiteHeader.module.css";

/** Hide on scroll down, show on scroll up — always visible near the top of the page. */
function useHideOnScroll(threshold = 8) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        const delta = y - lastY.current;
        if (y < 80) setHidden(false);
        else if (delta > threshold) setHidden(true);
        else if (delta < -threshold) setHidden(false);
        if (Math.abs(delta) > threshold || y < 80) lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return [hidden, setHidden] as const;
}

export default function SiteHeader() {
  const [hidden, setHidden] = useHideOnScroll();

  return (
    <header
      className={`${styles.header} ${hidden ? styles.hidden : ""}`}
      // keyboard users tabbing into the bar should always see it
      onFocusCapture={() => setHidden(false)}
    >
      <nav className={styles.nav} aria-label="Main">
        {navLinks.map((link) => (
          <Link key={link.label} href={link.href} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className={styles.logo} aria-label="hope's grocer — home">
        <span className={styles.logoBold}>hope</span>
        <span className={styles.logoApostrophe}>’</span>
        <span className={styles.logoBold}>s grocer</span>
      </Link>

      <a href={cartLink.href} className={styles.cart} aria-label={cartLink.ariaLabel}>
        <span className={styles.navLink}>{cartLink.label}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/cart.png" alt="" width={57} height={37} className={styles.cartIcon} />
      </a>
    </header>
  );
}
