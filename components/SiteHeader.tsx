"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cartLink, navLinks } from "@/data/site";
import styles from "./SiteHeader.module.css";

/** Hide on scroll down, show on scroll up — always visible near the top of the page. */
function useHideOnScroll(threshold = 14) {
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

/**
 * Intro: on the home page the bar waits off-screen, then slides down once the hero's load
 * sequence has landed (Hero fires "hero:intro" when it starts; the delay lives in CSS).
 */
function useIntro(enabled: boolean) {
  const [phase, setPhase] = useState<"off" | "waiting" | "playing" | "done">(enabled ? "waiting" : "off");

  useEffect(() => {
    if (!enabled) return;
    const start = () => setPhase((p) => (p === "waiting" ? "playing" : p));
    window.addEventListener("hero:intro", start);
    const fallback = window.setTimeout(start, 2500); // never leave the nav hidden
    return () => {
      window.removeEventListener("hero:intro", start);
      window.clearTimeout(fallback);
    };
  }, [enabled]);

  return [phase, () => setPhase("done")] as const;
}

export default function SiteHeader({ intro = false }: { intro?: boolean }) {
  const [hidden, setHidden] = useHideOnScroll();
  const [introPhase, finishIntro] = useIntro(intro);
  const introClass =
    introPhase === "waiting" ? styles.introWaiting : introPhase === "playing" ? styles.introPlaying : "";

  return (
    <header
      className={`${styles.header} ${hidden ? styles.hidden : ""} ${introClass}`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && introPhase === "playing") finishIntro();
      }}
      // keyboard users tabbing into the bar should always see it
      onFocusCapture={() => setHidden(false)}
    >
      {intro && (
        <noscript>
          <style>{`.${styles.introWaiting}{transform:none!important;opacity:1!important}`}</style>
        </noscript>
      )}
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
