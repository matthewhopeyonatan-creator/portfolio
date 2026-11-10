"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { addPage, logVisit } from "@/lib/visit";

/**
 * Notes each page a visitor opens and sends a summary of the visit to Matthew's log
 * (/admin/receipts) whenever they leave or switch away from the tab — so visitors who never check
 * out are logged too. Renders nothing.
 */
export default function VisitLogger() {
  const path = usePathname();

  useEffect(() => {
    if (path) addPage(path);
  }, [path]);

  useEffect(() => {
    let last = 0;
    const send = () => {
      // switching tabs back and forth shouldn't send a burst: at most once every 20s
      if (Date.now() - last < 20_000) return;
      last = Date.now();
      logVisit();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
    };
  }, []);

  return null;
}
