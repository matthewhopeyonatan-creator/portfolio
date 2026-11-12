"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Tilt from "@/components/Tilt";
import useMarker from "@/components/useMarker";
import { loadReceipt, logReceipt, mostViewed, saveReceipt, visitMinutes, withId, type Receipt as R } from "@/lib/visit";
import ThemedPair from "@/components/ThemedPair";
import ReceiptBack from "@/components/ReceiptBack";
import styles from "./Receipt.module.css";

/**
 * The checkout receipt (Figma 146:168): a paper slip, centred on the page — the shop's name, a
 * "orders" box with everything that was in the basket, notes the visitor can type, the
 * thing they looked at longest and their total time on the site. It tilts under the pointer (Tilt) and prints in on arrival.
 * "flip me!" turns it over on the spot to its back (ReceiptBack, Figma 504:4934): a photobooth that
 * prints a photo onto the slip. Both sides can be drawn on and downloaded (the small icon in each
 * one's bottom-right corner). With nothing checked out (someone landed here directly) it still
 * prints, with an empty basket and a way back to the shelves.
 */
// the checkout date as printed on the slip: MM/DD/YY (Figma 150:332)
const stamp = (t: number) => {
  const d = new Date(t);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(d.getMonth() + 1)}/${two(d.getDate())}/${two(d.getFullYear() % 100)}`;
};

export default function Receipt() {
  const [receipt, setReceipt] = useState<R | undefined>(undefined);
  const slip = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  // it prints photo side up (the photobooth); "flip me!" turns it to the order details
  const [flipped, setFlipped] = useState(true);
  const feed = useRef<HTMLDivElement>(null);
  const marker = useMarker();

  useEffect(() => {
    const saved = loadReceipt();
    if (saved) {
      const r = saved.items.length ? withId(saved) : saved;
      if (r !== saved) saveReceipt(r);
      setReceipt(r);
    }
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

  // Matthew's receipt log: once the slip has printed, and again a moment after each change to the
  // note or the drawing, a picture of the slip as it looks goes with the receipt (logReceipt);
  // leaving the page sends the latest note too
  const latest = useRef(receipt);
  latest.current = receipt;
  const logged = !!receipt?.items.length;
  useEffect(() => {
    if (!logged) return;
    let alive = true;
    const t = window.setTimeout(
      async () => {
        const r = latest.current;
        if (!r || !alive) return;
        let image: string | undefined;
        try {
          const node = slip.current;
          if (node) {
            const { toPng } = await import("html-to-image");
            image = await toPng(node, {
              pixelRatio: 1,
              backgroundColor: getComputedStyle(node).backgroundColor || "#ffffff",
              filter: (n) => !(n instanceof HTMLElement && ("tiltSheen" in n.dataset || "noSnapshot" in n.dataset)),
            });
          }
        } catch {}
        if (alive) logReceipt(r, image);
      },
      marker.version === 0 && !receipt?.note ? 6000 : 2500,
    );
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [logged, receipt?.note, marker.version]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const leave = () => latest.current && logReceipt(latest.current, undefined, true);
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, []);

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
  // a picture of one side of the slip, as it looks (the back is turned over in place, so it's
  // drawn face-on)
  const download = async (node: HTMLElement | null, name: string) => {
    if (!node) return;
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(node, {
      pixelRatio: 2,
      // the slip's own paper colour, so a dark-mode receipt saves dark
      backgroundColor: getComputedStyle(node).backgroundColor || "#ffffff",
      style: { transform: "none", backfaceVisibility: "visible" },
      filter: (n) => !(n instanceof HTMLElement && ("tiltSheen" in n.dataset || "noSnapshot" in n.dataset)),
    });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const saveIcon = (side: "front" | "back") => (
    <button
      type="button"
      className={styles.save}
      onClick={() =>
        download(
          side === "front" ? slip.current : back.current,
          side === "front" ? "hopes-grocer-receipt.png" : "hopes-grocer-photobooth.png",
        )
      }
      aria-label="Download this side of the receipt"
      title="Download"
      data-no-snapshot
    >
      <Download aria-hidden="true" strokeWidth={2} />
    </button>
  );

  return (
    <main className={styles.page}>
      <h1 className="visually-hidden">Your receipt</h1>
      <div className={styles.stage}>
        {/* blurred tomatoes behind the slip (Figma 146:168), placed relative to it in receipt px */}
        <div className={styles.tomatoes} aria-hidden="true">
          <div className="theme-pair theme-pair-filter" style={{ display: "contents" }}>
            <ThemedPair
              light="/receipt/tomato-back.svg"
              dark="/receipt/dark/tomato-back.webp"
              render={(v) => (
                <Image key={v.className} ref={v.imgRef} onLoad={v.onLoad} data-ready={v.ready ? "" : undefined} className={`${styles.tomato} ${styles.tomatoBack} ${v.className}`} src={v.src} alt="" width={622} height={645} unoptimized priority={v.className === "theme-light"} />
              )}
            />
          </div>
          <div className="theme-pair theme-pair-filter" style={{ display: "contents" }}>
            <ThemedPair
              light="/receipt/tomato-right.svg"
              dark="/receipt/dark/tomato-right.webp"
              render={(v) => (
                <Image key={v.className} ref={v.imgRef} onLoad={v.onLoad} data-ready={v.ready ? "" : undefined} className={`${styles.tomato} ${styles.tomatoRight} ${v.className}`} src={v.src} alt="" width={719} height={674} unoptimized priority={v.className === "theme-light"} />
              )}
            />
          </div>
          <div className="theme-pair theme-pair-filter" style={{ display: "contents" }}>
            <ThemedPair
              light="/receipt/tomato-left.svg"
              dark="/receipt/dark/tomato-left.webp"
              render={(v) => (
                <Image key={v.className} ref={v.imgRef} onLoad={v.onLoad} data-ready={v.ready ? "" : undefined} className={`${styles.tomato} ${styles.tomatoLeft} ${v.className}`} src={v.src} alt="" width={903} height={815} unoptimized priority={v.className === "theme-light"} />
              )}
            />
          </div>
        </div>
        <div ref={feed} className={styles.print}>
          <Tilt className={styles.tilt}>
            {/* turned over in place by "flip me!": both faces stacked, the back already facing away */}
            <div className={`${styles.flipper} ${flipped ? styles.flipped : ""}`}>
            <div ref={slip} className={`${styles.slip} ${styles.face} ${styles.front}`} {...marker.handlers} inert={flipped}>
              {/* the marker people can draw on the receipt with — red, mint in dark mode (useMarker) */}
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
                  <p className={styles.heading}>Leave a message</p>
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
                    aria-label="Leave a message"
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
              {saveIcon("front")}
            </div>
            <ReceiptBack ref={back} className={`${styles.face} ${styles.backFace}`} hidden={!flipped} download={saveIcon("back")} inert={!flipped} />
            </div>
          </Tilt>
        </div>

        <div className={styles.actions}>
          {empty ? (
            <Link className={styles.button} href="/#seasonal-picks">
              start shopping
            </Link>
          ) : null}
          <button
            type="button"
            className={styles.flip}
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
          >
            flip me!
          </button>
        </div>
      </div>
    </main>
  );
}
