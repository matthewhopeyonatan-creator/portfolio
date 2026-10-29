"use client";

import Image from "next/image";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Tilt from "@/components/Tilt";
import useMarker from "@/components/useMarker";
import { loadReceipt, mostViewed, saveReceipt, visitMinutes, type Receipt as R } from "@/lib/visit";
import { useTheme } from "@/lib/theme";
import styles from "./Receipt.module.css";

/**
 * The checkout receipt (Figma 146:168): a paper slip, centred on the page — the shop's name, a
 * "orders" box with everything that was in the basket, notes the visitor can type, the
 * thing they looked at longest and their total time on the site. It tilts under the pointer (Tilt), prints in on arrival, and can be downloaded
 * as an image or shared. With nothing checked out (someone landed here directly) it still prints,
 * with an empty basket and a way back to the shelves.
 */
// the checkout date as printed on the slip: MM/DD/YY (Figma 150:332)
const stamp = (t: number) => {
  const d = new Date(t);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(d.getMonth() + 1)}/${two(d.getDate())}/${two(d.getFullYear() % 100)}`;
};

export default function Receipt() {
  const dark = useTheme() === "dark";
  const [receipt, setReceipt] = useState<R | undefined>(undefined);
  const slip = useRef<HTMLDivElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const marker = useMarker();
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    const saved = loadReceipt();
    if (saved) setReceipt(saved);
    else setReceipt({ items: [], minutes: visitMinutes(), mostViewed: mostViewed(), at: Date.now() });
  }, []);

  // how far the slip has to start below its resting place to sit just under the bottom of the
  // window — the print animation feeds it up from there (--feed, measured before the first paint)
  const ready = !!receipt;
  useLayoutEffect(() => {
    const el = feed.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    el.style.setProperty("--feed", `${Math.ceil(window.innerHeight - stage.getBoundingClientRect().top)}px`);
  }, [ready]);

  if (!receipt) return <main className={styles.page} />;

  const empty = receipt.items.length === 0;
  const note = receipt.note ?? "";
  const setNote = (v: string) => {
    const next = { ...receipt, note: v };
    setReceipt(next);
    if (!empty) saveReceipt(next); // keeps the note through a refresh
  };
  // the note is one line until there's more to say, so the rest of the band stays free to draw on
  const fitNote = (t: HTMLTextAreaElement) => {
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  };
  const snapshot = async () => {
    const node = slip.current;
    if (!node) return null;
    const { toBlob } = await import("html-to-image");
    return toBlob(node, {
      pixelRatio: 2,
      // the slip's own paper colour, so a dark-mode receipt saves dark
      backgroundColor: getComputedStyle(node).backgroundColor || "#ffffff",
      filter: (n) => !(n instanceof HTMLElement && ("tiltSheen" in n.dataset || "noSnapshot" in n.dataset)),
    });
  };

  const download = async () => {
    const blob = await snapshot();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hopes-grocer-receipt.png";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async () => {
    const site = window.location.origin;
    const text = "My receipt from hope’s grocer — Matthew Hope’s portfolio";
    try {
      const blob = await snapshot();
      const file = blob ? new File([blob], "hopes-grocer-receipt.png", { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "hope’s grocer", text, url: site });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "hope’s grocer", text, url: site });
        return;
      }
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return; // they closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(site);
      setShareNote("link copied");
    } catch {
      setShareNote(site);
    }
    window.setTimeout(() => setShareNote(""), 2200);
  };

  return (
    <main className={styles.page}>
      <h1 className="visually-hidden">Your receipt</h1>
      <div className={styles.stage}>
        {/* blurred tomatoes behind the slip (Figma 146:168), placed relative to it in receipt px */}
        <div className={styles.tomatoes} aria-hidden="true">
          <Image className={`${styles.tomato} ${styles.tomatoBack}`} src={`/receipt/${dark ? "dark/" : ""}tomato-back.svg`} alt="" width={622} height={645} unoptimized priority />
          <Image className={`${styles.tomato} ${styles.tomatoRight}`} src={`/receipt/${dark ? "dark/" : ""}tomato-right.svg`} alt="" width={719} height={674} unoptimized priority />
          <Image className={`${styles.tomato} ${styles.tomatoLeft}`} src={`/receipt/${dark ? "dark/" : ""}tomato-left.svg`} alt="" width={903} height={815} unoptimized priority />
        </div>
        <div ref={feed} className={styles.print}>
          <Tilt className={styles.tilt}>
            <div ref={slip} className={styles.slip} {...marker.handlers}>
              {/* the red marker people can draw on the receipt with (useMarker) */}
              <canvas ref={marker.canvas} className={styles.ink} aria-hidden="true" />
              {/* start the drawing over — top-right of the slip, only once something's been drawn;
                  left out of the downloaded image */}
              <button
                type="button"
                className={`${styles.clear} ${marker.drawn ? styles.clearOn : ""}`}
                onClick={marker.clear}
                tabIndex={marker.drawn ? 0 : -1}
                aria-hidden={!marker.drawn}
                aria-label="Clear drawing"
                title="Clear drawing"
                data-no-snapshot
              >
                <RotateCcw aria-hidden="true" strokeWidth={2} />
              </button>
              <p className={styles.logo} aria-label="hope’s grocer">
                <span className={styles.logoBold}>hope</span>
                <span className={styles.logoApostrophe}>’</span>
                <span className={styles.logoBold}>s grocer</span>
              </p>
              <div className={styles.orderRow}>
                <p className={`${styles.heading} ${styles.orders}`}>Orders</p>
                <p className={`${styles.heading} ${styles.date}`}>
                  <time dateTime={new Date(receipt.at).toISOString()}>{stamp(receipt.at)}</time>
                </p>
              </div>

              <div className={styles.box}>
                <ul className={styles.items}>
                  {empty ? (
                    <li className={styles.item}>Your basket is empty</li>
                  ) : (
                    receipt.items.map((i) => (
                      <li key={i.name} className={styles.item}>
                        <span>{i.name}</span>
                        <span className={styles.qty}>× {i.qty}</span>
                      </li>
                    ))
                  )}
                </ul>

                <div className={styles.notes}>
                  <p className={styles.heading}>Notes</p>
                  <textarea
                    className={styles.note}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      fitNote(e.target);
                    }}
                    ref={(n) => {
                      if (n) fitNote(n);
                    }}
                    placeholder="Add a note…"
                    rows={1}
                    maxLength={280}
                    aria-label="Notes"
                  />
                </div>

                <dl className={styles.summary}>
                  <div className={styles.line}>
                    <dt>Most viewed</dt>
                    <dd>{receipt.mostViewed ?? "Just browsing"}</dd>
                  </div>
                  <div className={styles.line}>
                    <dt>Total</dt>
                    <dd>
                      {receipt.minutes} {receipt.minutes === 1 ? "minute" : "minutes"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Tilt>
        </div>

        <div className={styles.actions}>
          {empty ? (
            <Link className={styles.button} href="/#seasonal-picks">
              start shopping
            </Link>
          ) : (
            <>
              <button type="button" className={styles.button} onClick={download}>
                download
              </button>
              <button type="button" className={styles.button} onClick={share}>
                {shareNote || "share"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
