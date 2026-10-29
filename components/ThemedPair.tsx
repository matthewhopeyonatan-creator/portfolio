"use client";

import { useRef, useState } from "react";
import { getTheme, useTheme, useWarm } from "@/lib/theme";

/**
 * A picture with a light and a dark version (the tomatoes), crossfaded by theme. Both versions
 * sit stacked in a `.theme-pair` box (globals.css); the other theme's one is only put on the page
 * once it's warmed (lib/theme.ts), and a version only shows once it has loaded and decoded — until
 * then the one already on screen stays. `render` draws one version (the caller's own <img> or
 * next/image with its own classes); `onFirstReady` fires once, when the version for the theme on
 * screen is ready (for load-in sequencing).
 */
export default function ThemedPair({
  light,
  dark,
  render,
  onFirstReady,
}: {
  light: string;
  dark: string;
  render: (v: {
    src: string;
    className: string;
    ready: boolean;
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    imgRef: (img: HTMLImageElement | null) => void;
  }) => React.ReactNode;
  onFirstReady?: () => void;
}) {
  const theme = useTheme();
  const warm = useWarm();
  const [ready, setReady] = useState({ light: false, dark: false });
  const told = useRef(false);

  const done = (which: "light" | "dark", img: HTMLImageElement) => {
    if (img.dataset.seen) return;
    img.dataset.seen = "";
    (img.decode ? img.decode() : Promise.resolve())
      .catch(() => {})
      .then(() => {
        setReady((r) => (r[which] ? r : { ...r, [which]: true }));
        if (!told.current && which === getTheme()) {
          told.current = true;
          onFirstReady?.();
        }
      });
  };
  const onLoad = (which: "light" | "dark") => (e: React.SyntheticEvent<HTMLImageElement>) =>
    done(which, e.currentTarget);
  // a picture that finished loading before the page came alive never fires onLoad
  const ref = (which: "light" | "dark") => (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth) done(which, img);
  };

  const show = (which: "light" | "dark") => theme === which || warm || ready[which];
  return (
    <>
      {show("light") &&
        render({
          src: light,
          className: "theme-light",
          ready: ready.light,
          onLoad: onLoad("light"),
          imgRef: ref("light"),
        })}
      {show("dark") &&
        render({
          src: dark,
          className: "theme-dark",
          ready: ready.dark,
          onLoad: onLoad("dark"),
          imgRef: ref("dark"),
        })}
    </>
  );
}
