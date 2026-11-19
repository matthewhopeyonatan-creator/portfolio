"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Tilt from "@/components/Tilt";
import useMarker from "@/components/useMarker";
import { contactLinks } from "@/data/site";
import {
  loadReceipt,
  logReceipt,
  mostViewed,
  saveReceipt,
  visitMinutes,
  withId,
  type Receipt as R,
} from "@/lib/visit";
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
 *
 * Wide screens (Figma 533:1333): it prints in the middle of the page, then slides over to the left
 * while "THANKS FOR COMING" and the contact links slide in on the right; the tomatoes fill in after.
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
  const stageRef = useRef<HTMLDivElement>(null);
  const marker = useMarker();
  // goes up when the photobooth side changes (a photo printed, a stroke drawn or cleared), so the
  // log gets a fresh picture of that side too
  const [backVersion, setBackVersion] = useState(0);

  useEffect(() => {
    const saved = loadReceipt();
    if (saved) {
      const r = saved.items.length ? withId(saved) : saved;
      if (r !== saved) saveReceipt(r);
      setReceipt(r);
    } else
      setReceipt({
        items: [],
        minutes: visitMinutes(),
        mostViewed: mostViewed(),
        at: Date.now(),
      });
  }, []);

  // how far the slip has to start below its resting place to sit just under the bottom of the
  // window — the print animation feeds it up from there (--feed, measured before the first paint)
  const ready = !!receipt;
  useLayoutEffect(() => {
    const el = feed.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    el.style.setProperty(
      "--feed",
      `${Math.ceil(window.innerHeight - stage.getBoundingClientRect().top)}px`,
    );
    // wide screens: how far right of its resting place the slip prints (the middle of the window),
    // so it can slide over to the left once it's out (--shift)
    const st = stageRef.current;
    if (st) {
      const r = st.getBoundingClientRect();
      st.style.setProperty(
        "--shift",
        `${Math.round(window.innerWidth / 2 - (r.left + r.width / 2))}px`,
      );
    }
  }, [ready]);

  // Matthew's receipt log: once the slip has printed, and again a moment after each change to the
  // note, a drawing or the photo, pictures of both sides as they look go with the receipt
  // (logReceipt: the order side as PNG, the photobooth side as JPEG — its photo is grainy and
  // compresses far better that way); leaving the page sends the latest note too
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
        let backImage: string | undefined;
        const skip = (n: Node) =>
          !(
            n instanceof HTMLElement &&
            ("tiltSheen" in n.dataset || "noSnapshot" in n.dataset)
          );
        try {
          const { toPng, toJpeg } = await import("html-to-image");
          const front = slip.current;
          if (front) {
            image = await toPng(front, {
              pixelRatio: 1,
              backgroundColor:
                getComputedStyle(front).backgroundColor || "#ffffff",
              filter: skip,
            });
          }
          const side = back.current;
          if (side) {
            backImage = await toJpeg(side, {
              pixelRatio: 1,
              quality: 0.85,
              backgroundColor:
                getComputedStyle(side).backgroundColor || "#ffffff",
              // it's turned over in place; draw it face-on
              style: { transform: "none", backfaceVisibility: "visible" },
              filter: skip,
            });
          }
        } catch {}
        if (alive) logReceipt(r, image, false, backImage);
      },
      marker.version === 0 && backVersion === 0 && !receipt?.note ? 6000 : 2500,
    );
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [logged, receipt?.note, marker.version, backVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const leave = () =>
      latest.current && logReceipt(latest.current, undefined, true);
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
      filter: (n) =>
        !(
          n instanceof HTMLElement &&
          ("tiltSheen" in n.dataset || "noSnapshot" in n.dataset)
        ),
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
          side === "front"
            ? "hopes-grocer-receipt.png"
            : "hopes-grocer-photobooth.png",
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
      {/* blurred tomatoes behind everything on the page (Figma 146:168 / 533:1333) */}
      <div className={styles.tomatoes} aria-hidden="true">
        <div
          className="theme-pair theme-pair-filter"
          style={{ display: "contents" }}
        >
          <ThemedPair
            light="/receipt/tomato-back-soft.svg"
            dark="/receipt/dark/tomato-back-soft.webp"
            render={(v) => (
              <Image
                key={v.className}
                ref={v.imgRef}
                onLoad={v.onLoad}
                data-ready={v.ready ? "" : undefined}
                className={`${styles.tomato} ${styles.tomatoBack} ${v.className}`}
                src={v.src}
                alt=""
                width={622}
                height={645}
                unoptimized
                priority={v.className === "theme-light"}
              />
            )}
          />
        </div>
        <div
          className="theme-pair theme-pair-filter"
          style={{ display: "contents" }}
        >
          <ThemedPair
            light="/receipt/tomato-right-soft.svg"
            dark="/receipt/dark/tomato-right-soft.webp"
            render={(v) => (
              <Image
                key={v.className}
                ref={v.imgRef}
                onLoad={v.onLoad}
                data-ready={v.ready ? "" : undefined}
                className={`${styles.tomato} ${styles.tomatoRight} ${v.className}`}
                src={v.src}
                alt=""
                width={719}
                height={674}
                unoptimized
                priority={v.className === "theme-light"}
              />
            )}
          />
        </div>
        <div
          className="theme-pair theme-pair-filter"
          style={{ display: "contents" }}
        >
          <ThemedPair
            light="/receipt/tomato-left-soft.svg"
            dark="/receipt/dark/tomato-left-soft.webp"
            render={(v) => (
              <Image
                key={v.className}
                ref={v.imgRef}
                onLoad={v.onLoad}
                data-ready={v.ready ? "" : undefined}
                className={`${styles.tomato} ${styles.tomatoLeft} ${v.className}`}
                src={v.src}
                alt=""
                width={903}
                height={815}
                unoptimized
                priority={v.className === "theme-light"}
              />
            )}
          />
        </div>
      </div>
      <div className={styles.layout}>
        <div ref={stageRef} className={styles.stage}>
          <div ref={feed} className={styles.print}>
            <Tilt className={styles.tilt}>
              {/* turned over in place by "flip me!": both faces stacked, the back already facing away */}
              <div
                className={`${styles.flipper} ${flipped ? styles.flipped : ""}`}
              >
                <div
                  ref={slip}
                  className={`${styles.slip} ${styles.face} ${styles.front}`}
                  {...marker.handlers}
                  inert={flipped}
                >
                  {/* the marker people can draw on the receipt with — red, mint in dark mode (useMarker) */}
                  <canvas
                    ref={marker.canvas}
                    className={styles.ink}
                    aria-hidden="true"
                  />
                  {/* start the drawing over — bottom-left of the slip, only once something's been drawn;
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
                    <p className={`${styles.heading} ${styles.orders}`}>
                      Orders
                    </p>
                    <p className={`${styles.heading} ${styles.date}`}>
                      <time dateTime={new Date(receipt.at).toISOString()}>
                        {stamp(receipt.at)}
                      </time>
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
                          {receipt.minutes}{" "}
                          {receipt.minutes === 1 ? "minute" : "minutes"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  {saveIcon("front")}
                </div>
                <ReceiptBack
                  ref={back}
                  className={`${styles.face} ${styles.backFace}`}
                  hidden={!flipped}
                  download={saveIcon("back")}
                  inert={!flipped}
                  onChange={setBackVersion}
                />
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

        {/* Figma 533:1333: the thank-you and the contact links, right of the slip */}
        <div className={styles.copy}>
          <h2 className={styles.thanks}>
            Thanks for
            <br />
            coming
          </h2>
          <p className={styles.lede}>
            Take a picture and draw,
            <br />
            keep a memory from your time here!
          </p>
          <p className={`${styles.lede} ${styles.grow}`}>
            Let’s grow something together
          </p>
          <ul className={styles.socials} aria-label="Find me elsewhere">
            {contactLinks.map((l) => (
              <li key={l.label}>
                <a
                  className={styles.social}
                  href={l.href}
                  aria-label={l.label}
                  title={l.label}
                  {...(l.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <SocialIcon name={l.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

/** Figma 533:1601's icons (X, Instagram, LinkedIn, mail), filled with the ink */
function SocialIcon({
  name,
}: {
  name: "x" | "instagram" | "linkedin" | "email";
}) {
  if (name === "email")
    return (
      <svg
        viewBox="0 0 37 30"
        width="37"
        height="30"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M7.36077 0C3.29578 0 0 3.29578 0 7.36075V22.0823C0 26.1472 3.29578 29.443 7.36077 29.443H29.4431C33.5081 29.443 36.8038 26.1472 36.8038 22.0823V7.36075C36.8038 3.29578 33.5081 0 29.4431 0H7.36077ZM7.36077 3.68038H29.4431C31.298 3.68038 32.8309 5.04213 33.0848 6.82711C31.3219 8.4704 28.7015 10.4872 26.9699 11.7312C22.9859 14.5927 19.4803 16.5617 18.4019 16.5617C17.3236 16.5617 13.818 14.5945 9.83398 11.7312C8.10236 10.4872 6.4002 9.14205 5.11759 8.05082C4.57105 7.58525 4.16618 7.20986 3.85335 6.9007C4.1073 5.11572 5.50586 3.68038 7.36077 3.68038ZM3.6988 11.6926C8.36921 15.4705 15.2129 20.22 18.4019 20.2421C20.4795 20.2568 24.0329 18.2731 27.6581 15.7686C29.5332 14.4712 31.62 12.931 33.1253 11.6668L33.1235 22.0823C33.1235 24.1157 31.4765 25.7626 29.4431 25.7626H7.36077C5.32736 25.7626 3.68038 24.1157 3.68038 22.0823L3.6988 11.6926Z" />
      </svg>
    );
  return (
    <svg
      viewBox="0 0 38 38"
      width="38"
      height="38"
      fill="currentColor"
      aria-hidden="true"
    >
      {name === "x" ? (
        <path d="M28.2709 2.93701H33.4749L22.1057 15.9313L35.4807 33.6136H25.0082L16.8058 22.8894L7.42029 33.6136H2.21313L14.3736 19.7147L1.54297 2.93701H12.2813L19.6956 12.7394L28.2709 2.93701ZM26.4445 30.4987H29.3281L10.7145 5.88826H7.62008L26.4445 30.4987Z" />
      ) : name === "instagram" ? (
        <>
          <path d="M18.5115 3.33352C23.4575 3.33352 24.0433 3.35521 25.9884 3.44198C27.7962 3.52152 28.7724 3.82523 29.4232 4.07831C30.2837 4.41094 30.9055 4.81588 31.5491 5.45945C32.1999 6.11024 32.5976 6.72488 32.9302 7.58538C33.1833 8.23617 33.487 9.21959 33.5666 11.0201C33.6533 12.9725 33.675 13.5582 33.675 18.497C33.675 23.4431 33.6533 24.0288 33.5666 25.9739C33.487 27.7817 33.1833 28.7579 32.9302 29.4087C32.5976 30.2692 32.1926 30.8911 31.5491 31.5346C30.8983 32.1854 30.2837 32.5831 29.4232 32.9158C28.7724 33.1688 27.7889 33.4725 25.9884 33.5521C24.036 33.6389 23.4503 33.6606 18.5115 33.6606C13.5655 33.6606 12.9797 33.6389 11.0346 33.5521C9.22682 33.4725 8.25063 33.1688 7.59984 32.9158C6.73934 32.5831 6.11747 32.1782 5.47391 31.5346C4.82311 30.8838 4.4254 30.2692 4.09278 29.4087C3.83969 28.7579 3.53598 27.7745 3.45644 25.9739C3.36967 24.0216 3.34798 23.4358 3.34798 18.497C3.34798 13.551 3.36967 12.9653 3.45644 11.0201C3.53598 9.21236 3.83969 8.23617 4.09278 7.58538C4.4254 6.72488 4.83034 6.10301 5.47391 5.45945C6.1247 4.80865 6.73934 4.41094 7.59984 4.07831C8.25063 3.82523 9.23406 3.52152 11.0346 3.44198C12.9797 3.35521 13.5655 3.33352 18.5115 3.33352ZM18.5115 0C13.4859 0 12.8568 0.0216932 10.8827 0.108466C8.91589 0.195238 7.56368 0.513405 6.39225 0.968961C5.1702 1.44621 4.13616 2.07531 3.10935 3.10935C2.07531 4.13616 1.44621 5.1702 0.968961 6.38502C0.513405 7.56368 0.195238 8.90866 0.108466 10.8755C0.0216932 12.8568 0 13.4859 0 18.5115C0 23.5371 0.0216932 24.1662 0.108466 26.1403C0.195238 28.1071 0.513405 29.4593 0.968961 30.6307C1.44621 31.8528 2.07531 32.8868 3.10935 33.9136C4.13616 34.9405 5.1702 35.5768 6.38502 36.0468C7.56368 36.5024 8.90866 36.8205 10.8755 36.9073C12.8496 36.9941 13.4787 37.0158 18.5043 37.0158C23.5298 37.0158 24.1589 36.9941 26.133 36.9073C28.0999 36.8205 29.4521 36.5024 30.6235 36.0468C31.8383 35.5768 32.8724 34.9405 33.8992 33.9136C34.926 32.8868 35.5623 31.8528 36.0323 30.638C36.4879 29.4593 36.8061 28.1143 36.8928 26.1475C36.9796 24.1734 37.0013 23.5443 37.0013 18.5187C37.0013 13.4931 36.9796 12.864 36.8928 10.89C36.8061 8.92312 36.4879 7.57091 36.0323 6.39948C35.5768 5.1702 34.9477 4.13616 33.9136 3.10935C32.8868 2.08254 31.8528 1.44621 30.638 0.976192C29.4593 0.520636 28.1143 0.20247 26.1475 0.115697C24.1662 0.0216932 23.5371 0 18.5115 0Z" />
          <path d="M18.5118 9.00269C13.262 9.00269 9.00293 13.2618 9.00293 18.5115C9.00293 23.7613 13.262 28.0204 18.5118 28.0204C23.7615 28.0204 28.0206 23.7613 28.0206 18.5115C28.0206 13.2618 23.7615 9.00269 18.5118 9.00269ZM18.5118 24.6796C15.1059 24.6796 12.3437 21.9173 12.3437 18.5115C12.3437 15.1057 15.1059 12.3434 18.5118 12.3434C21.9176 12.3434 24.6799 15.1057 24.6799 18.5115C24.6799 21.9173 21.9176 24.6796 18.5118 24.6796Z" />
          <path d="M30.6166 8.62655C30.6166 9.85583 29.6187 10.8465 28.3967 10.8465C27.1674 10.8465 26.1768 9.8486 26.1768 8.62655C26.1768 7.39727 27.1746 6.40662 28.3967 6.40662C29.6187 6.40662 30.6166 7.4045 30.6166 8.62655Z" />
        </>
      ) : (
        <path d="M34.2824 0H2.73334C1.22205 0 0 1.19312 0 2.66826V34.3475C0 35.8226 1.22205 37.023 2.73334 37.023H34.2824C35.7937 37.023 37.023 35.8226 37.023 34.3547V2.66826C37.023 1.19312 35.7937 0 34.2824 0ZM10.984 31.5491H5.48837V13.8764H10.984V31.5491ZM8.23617 11.4685C6.47179 11.4685 5.04728 10.0439 5.04728 8.28679C5.04728 6.52964 6.47179 5.10512 8.23617 5.10512C9.99332 5.10512 11.4178 6.52964 11.4178 8.28679C11.4178 10.0367 9.99332 11.4685 8.23617 11.4685ZM31.5491 31.5491H26.0607V22.9586C26.0607 20.9122 26.0246 18.2729 23.2045 18.2729C20.3482 18.2729 19.9143 20.5073 19.9143 22.814V31.5491H14.4332V13.8764H19.6974V16.2916H19.7697C20.5 14.9032 22.2933 13.4353 24.9616 13.4353C30.5223 13.4353 31.5491 17.0942 31.5491 21.8522V31.5491Z" />
      )}
    </svg>
  );
}
