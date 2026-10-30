"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

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
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (a.closest("[data-overlay-nav]")) return; // the project popup handles its own navbar
      // a case study is open over the page: the link's own sheet closes it first, then goes
      if (document.querySelector("[data-overlay-nav]")) return;
      const href = a.getAttribute("href")!;
      // "/#section" from another page is an ordinary page change
      if (href.startsWith("/") && window.location.pathname !== "/") return;
      const hash = href.replace(/^\//, "");
      const target = document.querySelector(hash);
      if (!(target instanceof HTMLElement)) return;
      // preventDefault is enough to stop Next's <Link> jumping there (it skips prevented clicks);
      // the click still reaches the link's own onClick, so a sheet it sits in (the cart, the
      // phone menu) can close itself
      e.preventDefault();
      // from inside the cart: wait for it to close and let the page go (starting Lenis again would
      // cut a glide begun while it was held still)
      const go = () => lenis.scrollTo(target, { duration: 1.4, force: true });
      const html = document.documentElement;
      if (html.classList.contains("cart-open") || html.classList.contains("lenis-stopped")) {
        const t0 = performance.now();
        const wait = () =>
          !html.classList.contains("lenis-stopped") || performance.now() - t0 > 600
            ? go()
            : requestAnimationFrame(wait);
        requestAnimationFrame(wait);
      } else go();
      history.replaceState(null, "", hash);
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

  // a new page starts at the top, unless its #hash names a section on it (a hash that isn't a
  // place on the page still starts at the top)
  const firstPath = useRef(true);
  useEffect(() => {
    const first = firstPath.current;
    firstPath.current = false;
    const id = window.location.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (target) {
      // land on the section; tell the smooth scroller too, or it would drift back to where the
      // previous page was scrolled
      if (first) return; // the browser handles a fresh load
      // the new page is still laying out (the hero sizes itself once it's mounted), so aim at the
      // section a few times as it settles; stop the moment the visitor scrolls themselves
      let stop = false;
      const halt = () => (stop = true);
      const aim = () => {
        if (stop) return;
        const el = document.getElementById(id);
        if (!el) return;
        if (lenisRef.current) lenisRef.current.scrollTo(el, { immediate: true, force: true });
        else el.scrollIntoView();
      };
      const timers = [0, 120, 300, 600, 1000].map((ms) => window.setTimeout(aim, ms));
      window.addEventListener("wheel", halt, { passive: true, once: true });
      window.addEventListener("touchstart", halt, { passive: true, once: true });
      window.addEventListener("keydown", halt, { once: true });
      return () => {
        timers.forEach((t) => window.clearTimeout(t));
        window.removeEventListener("wheel", halt);
        window.removeEventListener("touchstart", halt);
        window.removeEventListener("keydown", halt);
      };
    }
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  // freeze the page behind the cart
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (isOpen) lenis.stop();
    else lenis.start();
  }, [isOpen]);

  return null;
}
