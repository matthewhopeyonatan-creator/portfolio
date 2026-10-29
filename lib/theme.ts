"use client";

import { useSyncExternalStore } from "react";

/**
 * Dark mode — homepage only for now. The choice is kept per visitor (localStorage) and applied as
 * <html data-theme="dark"> while the homepage is open; the inline script in app/layout.tsx sets it
 * before first paint so a returning visitor never sees a light flash.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "hg-theme";

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
}

/** put the stored choice on the page (homepage mount) */
export function applyStoredTheme() {
  apply(readStoredTheme());
}

/** leave the homepage: the other pages are light-only for now */
export function clearTheme() {
  delete document.documentElement.dataset.theme;
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  // one soft crossfade of the whole page rather than every colour changing on its own
  if (doc.startViewTransition && !reduce) doc.startViewTransition(() => apply(theme));
  else apply(theme);
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

/** the theme currently on the page */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
