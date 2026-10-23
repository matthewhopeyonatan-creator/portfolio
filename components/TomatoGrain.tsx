"use client";

import { useEffect, useRef } from "react";

/**
 * The tomato, redrawn grain by grain. Every pixel of the tomato becomes a particle carrying its
 * colour with a touch of noise (so the fruit reads as finely grained), drawn on a canvas that
 * replaces the image. On hover, the particles under the cursor are pushed away from it, so the
 * tomato thins out there until it's nearly the beige page, then they drift back home.
 *
 * Drop it in right after the tomato's <img>, inside the same positioned parent. It copies the
 * img's box, so it inherits any rotation on that parent; pass that rotation (degrees) as
 * `rotate` so the cursor can be mapped into the tomato's own coordinates.
 */
const Q = 0.5; // particles per CSS px (each grain is 2 CSS px, smoothed by the canvas scale-up)
const NOISE_A = 0.22; // grain: random wobble in each particle's opacity…
const NOISE_L = 0.1; // …and brightness
const RADIUS = 100; // CSS px around the cursor where the tomato thins out
const FADE = 0.86; // how far the grains right under the cursor fade toward the page (0–1)
const FADE_IN = 0.18; // per-frame easing as the cursor arrives…
const FADE_OUT = 0.045; // …and as the tomato heals behind it
const PUSH = 0.38; // a gentle outward drift, so the grains scatter as they fade
const JITTER = 0.5;
const SPRING = 0.04;
const DAMP = 0.86;
const BUCKET = 24; // canvas px per spatial bucket

type Field = {
  w: number;
  h: number;
  n: number;
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  fade: Float32Array; // 0 = as drawn, 1 = gone
  col: Uint32Array;
  live: Uint8Array;
  liveList: number[];
  buckets: Int32Array[];
  bw: number;
  bh: number;
  img: ImageData;
  px: Uint32Array;
};

function buildField(img: HTMLImageElement, cssW: number, cssH: number): Field | null {
  const w = Math.max(1, Math.round(cssW * Q));
  const h = Math.max(1, Math.round(cssH * Q));
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0, w, h);
  } catch {
    return null;
  }
  const src = ctx.getImageData(0, 0, w, h).data;
  const keep: number[] = [];
  const cols: number[] = [];
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const a = src[i + 3];
    if (a < 3) continue;
    keep.push(p);
    const l = 1 + (Math.random() - 0.5) * 2 * NOISE_L;
    const na = clamp(a * (1 + (Math.random() - 0.5) * 2 * NOISE_A));
    cols.push(
      ((na << 24) | (clamp(src[i + 2] * l) << 16) | (clamp(src[i + 1] * l) << 8) | clamp(src[i] * l)) >>>
        0,
    );
  }
  const n = keep.length;
  const f: Field = {
    w,
    h,
    n,
    hx: new Float32Array(n),
    hy: new Float32Array(n),
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    fade: new Float32Array(n),
    col: Uint32Array.from(cols),
    live: new Uint8Array(n),
    liveList: [],
    buckets: [],
    bw: Math.ceil(w / BUCKET),
    bh: Math.ceil(h / BUCKET),
    img: new ImageData(w, h),
    px: new Uint32Array(0),
  };
  f.px = new Uint32Array(f.img.data.buffer);
  const lists: number[][] = Array.from({ length: f.bw * f.bh }, () => []);
  for (let k = 0; k < n; k++) {
    const p = keep[k];
    const x = p % w;
    const y = (p - x) / w;
    f.hx[k] = f.x[k] = x;
    f.hy[k] = f.y[k] = y;
    f.px[p] = f.col[k];
    lists[((y / BUCKET) | 0) * f.bw + ((x / BUCKET) | 0)].push(k);
  }
  f.buckets = lists.map((l) => Int32Array.from(l));
  return f;
}

export default function TomatoGrain({ rotate = 0 }: { rotate?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const img = canvas?.previousElementSibling as HTMLImageElement | null;
    const parent = canvas?.parentElement;
    if (!canvas || !img || img.tagName !== "IMG" || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const interactive =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(hover: hover)").matches;

    let field: Field | null = null;
    let raf = 0;
    let near = false;
    let mx = -1e6;
    let my = -1e6;
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);

    // the grain canvas sits exactly on the img's box
    const build = () => {
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      if (!img.complete || !img.naturalWidth || !w || !h) return;
      canvas.style.left = `${img.offsetLeft}px`;
      canvas.style.top = `${img.offsetTop}px`;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (field && field.w === Math.round(w * Q) && field.h === Math.round(h * Q)) return;
      field = buildField(img, w, h);
      if (!field) return;
      canvas.width = field.w;
      canvas.height = field.h;
      ctx.putImageData(field.img, 0, 0);
      // the grain tomato takes over from the picture (same colours, so it's a seamless swap)
      canvas.style.opacity = "1";
      img.style.visibility = "hidden";
    };
    let idle = 0;
    const schedule = () => {
      cancelIdle();
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 60));
      idle = ric(build) as unknown as number;
    };
    const cancelIdle = () => {
      if (!idle) return;
      (window.cancelIdleCallback ?? window.clearTimeout)(idle);
      idle = 0;
    };
    if (img.complete) schedule();
    img.addEventListener("load", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(img);

    // window point → canvas point (undoing the parent's rotation)
    const toLocal = (cx: number, cy: number) => {
      const r = parent.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height / 2);
      const s = field ? field.w / img.offsetWidth : Q;
      return [
        (dx * cos - dy * sin + parent.offsetWidth / 2 - img.offsetLeft) * s,
        (dx * sin + dy * cos + parent.offsetHeight / 2 - img.offsetTop) * s,
      ] as const;
    };

    const step = () => {
      raf = 0;
      const f = field;
      if (!f) return;
      const R = RADIUS * (f.w / img.offsetWidth);
      // wake the particles around the cursor
      if (near) {
        const b0x = Math.max(0, ((mx - R) / BUCKET) | 0);
        const b1x = Math.min(f.bw - 1, ((mx + R) / BUCKET) | 0);
        const b0y = Math.max(0, ((my - R) / BUCKET) | 0);
        const b1y = Math.min(f.bh - 1, ((my + R) / BUCKET) | 0);
        for (let by = b0y; by <= b1y; by++)
          for (let bx = b0x; bx <= b1x; bx++) {
            const list = f.buckets[by * f.bw + bx];
            for (let j = 0; j < list.length; j++) {
              const k = list[j];
              if (!f.live[k]) {
                f.live[k] = 1;
                f.liveList.push(k);
              }
            }
          }
      }
      const { x, y, vx, vy, hx, hy, fade, live, px, col, w, h } = f;
      // dirty box: everywhere a moving grain was, is, or calls home
      let x0 = w;
      let y0 = h;
      let x1 = -1;
      let y1 = -1;
      const grow = (gx: number, gy: number) => {
        if (gx < x0) x0 = gx;
        if (gy < y0) y0 = gy;
        if (gx > x1) x1 = gx;
        if (gy > y1) y1 = gy;
      };
      const next: number[] = [];
      for (const k of f.liveList) {
        grow((x[k] + 0.5) | 0, (y[k] + 0.5) | 0);
        grow(hx[k], hy[k]);
        let ax = (hx[k] - x[k]) * SPRING;
        let ay = (hy[k] - y[k]) * SPRING;
        let target = 0;
        if (near) {
          const dx = hx[k] - mx;
          const dy = hy[k] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const t = 1 - d / R;
            const ease = t * t * (3 - 2 * t); // smoothstep: soft all the way to the edge
            target = ease;
            ax += (dx / d) * ease * PUSH + (Math.random() - 0.5) * JITTER * ease;
            ay += (dy / d) * ease * PUSH + (Math.random() - 0.5) * JITTER * ease;
          }
        }
        fade[k] += (target - fade[k]) * (target > fade[k] ? FADE_IN : FADE_OUT);
        vx[k] = (vx[k] + ax) * DAMP;
        vy[k] = (vy[k] + ay) * DAMP;
        x[k] += vx[k];
        y[k] += vy[k];
        grow((x[k] + 0.5) | 0, (y[k] + 0.5) | 0);
        const off = Math.abs(x[k] - hx[k]) + Math.abs(y[k] - hy[k]);
        if (
          !target &&
          fade[k] < 0.004 &&
          off < 0.05 &&
          Math.abs(vx[k]) + Math.abs(vy[k]) < 0.02
        ) {
          x[k] = hx[k];
          y[k] = hy[k];
          vx[k] = vy[k] = fade[k] = 0;
          live[k] = 0;
        } else next.push(k);
      }
      if (x1 >= 0) {
        x0 = Math.max(0, x0 - 1);
        y0 = Math.max(0, y0 - 1);
        x1 = Math.min(w - 1, x1 + 1);
        y1 = Math.min(h - 1, y1 + 1);
        // redraw just that box: clear it, put the resting specks back, then the moving ones
        for (let yy = y0; yy <= y1; yy++) px.fill(0, yy * w + x0, yy * w + x1 + 1);
        const b0x = (x0 / BUCKET) | 0;
        const b1x = (x1 / BUCKET) | 0;
        const b0y = (y0 / BUCKET) | 0;
        const b1y = (y1 / BUCKET) | 0;
        for (let by = b0y; by <= b1y; by++)
          for (let bx = b0x; bx <= b1x; bx++) {
            const list = f.buckets[by * f.bw + bx];
            for (let j = 0; j < list.length; j++) {
              const k = list[j];
              if (live[k]) continue; // still moving: drawn below at its current spot
              const gx = hx[k];
              const gy = hy[k];
              if (gx >= x0 && gx <= x1 && gy >= y0 && gy <= y1) px[gy * w + gx] = col[k];
            }
          }
        for (const k of next) {
          // round, not floor: a grain sitting a hair off home still lands on its own pixel
          const gx = (x[k] + 0.5) | 0;
          const gy = (y[k] + 0.5) | 0;
          if (gx < x0 || gx > x1 || gy < y0 || gy > y1) continue;
          const c = col[k];
          const a = ((c >>> 24) * (1 - FADE * fade[k])) | 0;
          px[gy * w + gx] = ((a << 24) | (c & 0xffffff)) >>> 0;
        }
        ctx.putImageData(f.img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      }
      f.liveList = next;
      if (near || next.length) raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !field) return;
      const [lx, ly] = toLocal(e.clientX, e.clientY);
      const R = RADIUS * (field.w / img.offsetWidth);
      const inBox = lx > -R && ly > -R && lx < field.w + R && ly < field.h + R;
      // something interactive drawn over the tomato (a sticker, a link, a popup, the bar)
      const top = inBox ? document.elementFromPoint(e.clientX, e.clientY) : null;
      const covered = !!top?.closest("a, button, header, [role=dialog]");
      near = inBox && !covered;
      mx = lx;
      my = ly;
      if ((near || field.liveList.length) && !raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => {
      near = false;
      if (!raf && field?.liveList.length) raf = requestAnimationFrame(step);
    };
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      img.removeEventListener("load", schedule);
      ro.disconnect();
      cancelIdle();
      cancelAnimationFrame(raf);
      img.style.visibility = "";
    };
  }, [rotate]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        pointerEvents: "none",
        opacity: 0,
      }}
    />
  );
}
