"use client";

import { useSyncExternalStore } from "react";

/**
 * Dark mode, site-wide. The choice is kept per visitor (localStorage) and applied as
 * <html data-theme="dark">; the inline script in app/layout.tsx sets it before first paint so a
 * returning visitor never sees a light flash. The switch itself lives on the landing.
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

const FADE = 450; // ms — the colours and the tomatoes change together

/* The tomatoes keep both versions on the page, stacked (ThemedPair / .theme-pair in globals.css),
   so the switch is a plain crossfade and nothing has to load or decode at the moment of the
   click. The other theme's versions are "warmed" — put on the page to load quietly — when the
   visitor reaches for the switch, or once the page has settled. */
let warm = false;
const warmSubs = new Set<() => void>();

export function prepareTheme() {
  if (warm) return;
  warm = true;
  warmSubs.forEach((f) => f());
}

export function useWarm() {
  return useSyncExternalStore(
    (f) => {
      warmSubs.add(f);
      return () => warmSubs.delete(f);
    },
    () => warm,
    () => false,
  );
}

if (typeof window !== "undefined") {
  // dark on arrival: the light versions are already coming with the page, keep them
  if (document.documentElement.dataset.theme === "dark") warm = true;
  // with a mouse, warm up once the page has loaded and gone quiet
  else if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const later = () => setTimeout(prepareTheme, 2500);
    if (document.readyState === "complete") later();
    else addEventListener("load", later, { once: true });
  }
}

let settle = 0;

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  prepareTheme(); // (a tap on a phone never hovered the switch first)
  // every colour eases across in place for this moment (globals.css, html.theme-fade) — no page
  // snapshot, so nothing freezes and the switch's knob slides the moment it's clicked
  const root = document.documentElement;
  root.classList.add("theme-fade");
  apply(theme);
  window.clearTimeout(settle);
  settle = window.setTimeout(() => root.classList.remove("theme-fade"), FADE + 100);
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

/** the theme currently on the page */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
