"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useCart } from "@/components/cart/CartContext";

/**
 * Site-wide smooth (inertial) scrolling via Lenis. It still drives the real page scroll, so
 * everything that reads window.scrollY (the hide-on-scroll navbar, the "start shopping" fade)
 * keeps working. Off for reduced-motion visitors; paused while the cart is open.
 */
export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const { isOpen } = useCart();

  // A refresh always starts back on the landing screen (browsers otherwise restore the old
  // scroll position). Links to a section (#…) still land on that section.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09, // lower = floatier
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;

    // in-page links (e.g. "start shopping") glide to their section too
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const target = document.querySelector(a.getAttribute("href")!);
      if (!(target instanceof HTMLElement)) return;
      e.preventDefault();
      e.stopPropagation(); // Next's <Link> would otherwise jump there instantly
      lenis.scrollTo(target, { duration: 1.4, force: true });
      history.replaceState(null, "", a.getAttribute("href"));
    };
    document.addEventListener("click", onClick, true); // capture: before React/Next handlers

    // overlays (e.g. the sticker story card) pause the page while they're up
    const onLock = (e: Event) => ((e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start());
    window.addEventListener("scroll-lock", onLock);

    // the logo asks to go back to the top of the page
    const onTop = (e: Event) => {
      (e as CustomEvent<{ handled: boolean }>).detail.handled = true;
      lenis.scrollTo(0, { duration: 1.4, force: true });
    };
    window.addEventListener("scroll-to-top", onTop);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll-lock", onLock);
      window.removeEventListener("scroll-to-top", onTop);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // freeze the page behind the cart
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (isOpen) lenis.stop();
    else lenis.start();
  }, [isOpen]);

  return null;
}
