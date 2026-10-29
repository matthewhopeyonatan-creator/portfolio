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

// the pictures that have a dark version (public/**/dark/): tomatoes, the cart, catalog arrows
const THEMED = /\/(home|catalog|receipt)\/(dark\/)?(tomato-[\w-]+\.(webp|svg)|cart\.png|arrow\.svg)$/;

function themedImages() {
  return [...document.images].filter((img) =>
    THEMED.test(new URL(img.currentSrc || img.src, location.href).pathname),
  );
}

/** a picture's version for a theme */
function swapped(src: string, theme: Theme) {
  const url = new URL(src, location.href);
  url.pathname = url.pathname.replace(/\/dark\//, "/");
  if (theme === "dark") url.pathname = url.pathname.replace(/\/(home|catalog|receipt)\//, "/$1/dark/");
  return url.href;
}

const warmed = new Set<string>();

/** start fetching + decoding the other theme's pictures on this page (when the switch is reached
    for), so the change never waits on the network */
export function prepareTheme(theme: Theme) {
  for (const img of themedImages()) {
    const href = swapped(img.currentSrc || img.src, theme);
    if (warmed.has(href)) continue;
    warmed.add(href);
    const pre = new Image();
    pre.decoding = "async";
    pre.src = href;
    pre.decode?.().catch(() => {});
  }
}

// (not requestAnimationFrame: the browser holds drawing while a view transition gets ready)
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** after the switch: let React swap the pictures' sources, then wait until they're decoded */
async function picturesReady() {
  await tick();
  await tick();
  const pending = themedImages().map((img) =>
    img.complete && img.naturalWidth ? Promise.resolve() : (img.decode?.() ?? Promise.resolve()).catch(() => {}),
  );
  // never hold the page for long: after 1.2s the fade goes ahead anyway
  await Promise.race([Promise.all(pending), new Promise((r) => setTimeout(r, 1200))]);
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  const doc = document as Document & {
    startViewTransition?: (cb: () => Promise<void>) => unknown;
  };
  // one soft crossfade of the whole page — colours and pictures together, once the new pictures
  // are ready — rather than every colour changing on its own and the tomatoes popping in after.
  // (A crossfade is already the gentle version, so it stays for reduced motion too.)
  if (!doc.startViewTransition) {
    apply(theme);
    return;
  }
  prepareTheme(theme);
  doc.startViewTransition(async () => {
    apply(theme);
    await picturesReady();
  });
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
