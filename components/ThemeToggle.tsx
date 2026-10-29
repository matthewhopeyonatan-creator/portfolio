"use client";

import { useEffect } from "react";
import { applyStoredTheme, clearTheme, setTheme, useTheme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

/**
 * Light / dark switch, top right of the landing (Figma 210:5291): a 105 × 48 pill with a 38px
 * knob. Mounted only on the homepage, so it also owns putting the visitor's choice on the page
 * while it's open and taking it off again on the way out.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";

  useEffect(() => {
    applyStoredTheme();
    return clearTheme;
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      className={`${styles.toggle} ${className}`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
