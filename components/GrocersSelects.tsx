"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { grocersSelects } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./GrocersSelects.module.css";

/**
 * Grocer's Selects: the graphics shelf as a stack of posters in depth, running on a low diagonal
 * from near (bottom left) to far (right), each turned away at an angle — a loop with no first or
 * last. Scrolling over the posters glides the stack along (elsewhere the page scrolls); a swipe
 * does it on touch. Hovering a poster turns it flat and the others make room (display only: no
 * click).
 * With reduced motion it's the plain four-across grid instead.
 */

const N = grocersSelects.length;
const NEAR = -1.8; // posters this far in front of the current one have gone (faded out by here)
const FAR = 8; // ...and this far behind it haven't come in yet
const WRAP = -3; // the loop's seam: posters go round from in front (gone) to the back (not yet in)
const GLIDE = 0.12; // share of the way to where the stack is heading, each frame

function Poster({ item }: { item: (typeof grocersSelects)[number] }) {
  return item.video ? (
    <video
      className={styles.poster}
      poster={item.src}
      width={742}
      height={988}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={`${item.title} — ${item.source}`}
    >
      <source src={item.video.replace(/\.mp4$/, ".webm")} type="video/webm" />
      <source src={item.video} type="video/mp4" />
    </video>
  ) : (
    <Image
      src={item.src}
      alt={`${item.title} — ${item.source}`}
      width={742}
      height={988}
      sizes="(max-width: 767px) 60vw, 26vw"
      loading="eager"
      className={styles.poster}
    />
  );
}

export default function GrocersSelects() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // the stack: a loop with no first or last poster. A wheel (or a sideways swipe) over the posters
  // moves it along; anywhere else the page scrolls as usual. Hovering one turns it flat and the
  // others make room for it on either side.
  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;
    const els = cards.current;
    let raf = 0;
    let W = 0;
    let H = 0;
    let pos = 0; // where the stack is: the poster at the front of it
    let goal = 0; // where it's gliding to
    let hovered = -1;
    const room = els.map(() => 0); // each poster's step aside for the hovered one (px)

    const measure = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
    };
    const wrap = (d: number) => ((((d - WRAP) % N) + N) % N) + WRAP;

    const frame = () => {
      raf = 0;
      pos += (goal - pos) * GLIDE;
      if (Math.abs(goal - pos) < 0.0005) pos = goal;
      const phone = W < 768;
      // one step along the diagonal: mostly across, a little up, smaller with distance
      const sx = W * (phone ? 0.11 : 0.072);
      const sy = H * (phone ? 0.035 : 0.03);
      const card = els[0]?.offsetWidth ?? 0;
      const len = Math.hypot(sx, sy) || 1;
      const ux = sx / len;
      const uy = sy / len;
      const hd = hovered >= 0 ? wrap(hovered - pos) : 0;
      let moving = pos !== goal;
      els.forEach((el, i) => {
        if (!el) return;
        const d = wrap(i - pos);
        // the hovered poster turns flat: the ones behind it step back, the ones in front step aside
        const want = hovered < 0 || i === hovered ? 0 : d > hd ? card * 0.62 : -card * 0.5;
        room[i] += (want - room[i]) * 0.16;
        if (Math.abs(want - room[i]) > 0.3) moving = true;
        else room[i] = want;
        // once past the front a poster speeds up and slides off the bottom left, fading as it goes
        const m = d < 0 ? d * 2.4 : d;
        const s = Math.max(0.35, 1 - m * 0.045);
        const fade = d < 0 ? (d - NEAR) / (-NEAR - 0.8) : (FAR - d) / 2;
        const o = Math.min(1, Math.max(0, fade));
        const x = m * sx + room[i] * ux;
        const y = -m * sy - room[i] * uy;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
      });
      if (moving) raf = requestAnimationFrame(frame);
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const hover = (i: number) => {
      if (hovered === i) return;
      if (hovered >= 0) els[hovered]?.classList.remove(styles.flat);
      hovered = i;
      if (i >= 0) els[i]?.classList.add(styles.flat);
      ask();
    };

    // the wheel over a poster moves the stack (and only there: elsewhere the page scrolls)
    const onWheel = (e: WheelEvent) => {
      if (!(e.target as Element).closest?.("[data-poster]")) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? H : 1;
      goal += (delta * unit) / 420;
      hover(-1); // the posters move out from under the pointer
      ask();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const li = (e.target as Element).closest?.("[data-poster]")?.parentElement as HTMLLIElement | null;
      hover(li ? els.indexOf(li) : -1);
    };
    const onLeave = () => hover(-1);

    // touch: a sideways swipe moves it (up and down still scroll the page)
    let drag: { x: number; t: number; v: number; id: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      drag = { x: e.clientX, t: e.timeStamp, v: 0, id: e.pointerId };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dt = Math.max(1, e.timeStamp - drag.t);
      drag.v = dx / dt;
      drag.x = e.clientX;
      drag.t = e.timeStamp;
      const step = W * (W < 768 ? 0.11 : 0.072);
      goal -= dx / step;
      pos = goal; // follow the finger directly
      ask();
    };
    const onUp = () => {
      if (!drag) return;
      const step = W * (W < 768 ? 0.11 : 0.072);
      goal -= (drag.v * 260) / step; // a flick carries on a little
      drag = null;
      ask();
    };

    measure();
    frame();
    const resize = () => {
      measure();
      ask();
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("pointerover", onOver);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerover", onOver);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  // the moving posters only play while the shelf is on screen
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        v.muted = true; // autoplay is only allowed muted (React doesn't always set the property)
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }
    });
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section id="grocers-selects" aria-labelledby="grocers-selects-title">
      <div className={`${pageStyles.sectionTitleRow} ${styles.titleRow}`}>
        <h2 id="grocers-selects-title" className={pageStyles.sectionTitle} data-reveal="up">
          Grocer’s selects
        </h2>
      </div>
      {reduced ? (
        <div ref={sectionRef}>
          <ul className={styles.grid}>
            {grocersSelects.map((item) => (
              <li key={item.src} className={styles.cell}>
                <Poster item={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div ref={sectionRef} className={styles.run}>
          <div ref={stageRef} className={styles.stage}>
            <ul className={styles.stack}>
              {grocersSelects.map((item, i) => (
                <li
                  key={item.src}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className={styles.card}
                  style={{ zIndex: N - i }}
                >
                  <figure className={styles.turn} data-poster data-lenis-prevent-wheel>
                    <Poster item={item} />
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
