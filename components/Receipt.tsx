"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Tilt from "@/components/Tilt";
import { loadReceipt, mostViewedSlug, visitMinutes, type Receipt as R } from "@/lib/visit";
import { projects } from "@/data/site";
import styles from "./Receipt.module.css";

const CONTACT = "matthew.hope.yonatan@gmail.com";

/**
 * The checkout receipt (Figma 146:168): a paper slip, centred on the page — the shop's name, a
 * "visit summary" box with everything that was in the basket, a note, and the most-viewed project
 * and time spent. It tilts under the pointer (Tilt), prints in on arrival, and can be downloaded
 * as an image or shared. With nothing checked out (someone landed here directly) it still prints,
 * with an empty basket and a way back to the shelves.
 */
export default function Receipt() {
  const [receipt, setReceipt] = useState<R | undefined>(undefined);
  const slip = useRef<HTMLDivElement>(null);
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    const saved = loadReceipt();
    if (saved) setReceipt(saved);
    else {
      const slug = mostViewedSlug();
      setReceipt({
        items: [],
        minutes: visitMinutes(),
        mostViewed: projects.find((p) => p.slug === slug)?.title ?? null,
        at: Date.now(),
      });
    }
  }, []);

  if (!receipt) return <main className={styles.page} />;

  const empty = receipt.items.length === 0;
  const mailto =
    `mailto:${CONTACT}?subject=${encodeURIComponent("My receipt from hope’s grocer")}` +
    `&body=${encodeURIComponent(
      "Hi Matthew,\n\n" +
        (empty
          ? "I stopped by hope’s grocer."
          : "I picked up:\n" +
            receipt.items.map((i) => `• ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}`).join("\n")) +
        "\n\nLet's talk!",
    )}`;

  const snapshot = async () => {
    const node = slip.current;
    if (!node) return null;
    const { toBlob } = await import("html-to-image");
    return toBlob(node, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      filter: (n) => !(n instanceof HTMLElement && "tiltSheen" in n.dataset),
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
        <div className={styles.print}>
          <Tilt className={styles.tilt}>
            <div ref={slip} className={styles.slip}>
              <p className={styles.logo} aria-label="hope’s grocer">
                <span className={styles.logoBold}>hope</span>
                <span className={styles.logoApostrophe}>’</span>
                <span className={styles.logoBold}>s grocer</span>
              </p>
              <p className={styles.heading}>Visit summary</p>

              <div className={styles.box}>
                <ul className={styles.items}>
                  {empty ? (
                    <li className={styles.item}>Your basket is empty</li>
                  ) : (
                    receipt.items.map((i) => (
                      <li key={i.name} className={styles.item}>
                        <span>{i.name}</span>
                        {i.qty > 1 ? <span className={styles.qty}>× {i.qty}</span> : null}
                      </li>
                    ))
                  )}
                </ul>

                <div className={styles.notes}>
                  <p className={styles.heading}>Notes</p>
                  <p className={styles.note}>
                    {empty
                      ? "Nothing rung up yet. Take a look around the shelves — everything here is fresh from Matthew’s studio."
                      : "Thanks for shopping at hope’s grocer! Everything here is fresh from Matthew’s studio. Want to talk about any of it? Say hi at "}
                    {empty ? null : (
                      <>
                        <a className={styles.mail} href={mailto}>
                          {CONTACT}
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>

                <dl className={styles.summary}>
                  <div className={styles.line}>
                    <dt>Most viewed</dt>
                    <dd>{receipt.mostViewed ?? "Just browsing"}</dd>
                  </div>
                  <div className={styles.line}>
                    <dt>Total</dt>
                    <dd>
                      ({receipt.minutes}) {receipt.minutes === 1 ? "minute" : "minutes"}
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
