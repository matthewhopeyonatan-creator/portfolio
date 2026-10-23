"use client";

import { useEffect, useRef } from "react";

/**
 * Hover a tomato and it breaks up into film grain: the image cross-fades to a stochastic
 * dither of itself (every grain keeps the colour of the pixel it came from), and the grains
 * nearest the cursor are blown away from it, drifting back home once it moves on.
 *
 * Drop it in right after the tomato's <img>, inside the same positioned parent. It copies the
 * img's box, so it also inherits any rotation on that parent; pass the parent's rotation in
 * degrees as `rotate` so the cursor can be mapped into the tomato's own coordinates.
 */
const Q = 0.5; // grain canvas resolution vs CSS px (one grain = 2 CSS px)
const RADIUS = 120; // CSS px around the cursor that the grains flee
const PUSH = 2.6;
const SPRING = 0.055;
const DAMP = 0.86;
const BUCKET = 24; // canvas px per spatial bucket

type Field = {
  w: number;
  h: number;
  alpha: Uint8Array; // source alpha at canvas res (hover hit-test)
  n: number;
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  col: Uint32Array;
  live: Uint8Array; // currently moving
  buckets: Int32Array[]; // particle indices per bucket
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
  const alpha = new Uint8Array(w * h);
  const keep: number[] = [];
  for (let i = 0, p = 0; p < w * h; p++, i += 4) {
    const a = src[i + 3];
    alpha[p] = a;
    // dither: a pixel becomes a grain with a chance set by its opacity
    if (a > 6 && Math.random() < Math.pow(a / 255, 1.15) * 0.9) keep.push(p);
  }
  const n = keep.length;
  const f: Field = {
    w,
    h,
    alpha,
    n,
    hx: new Float32Array(n),
    hy: new Float32Array(n),
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    col: new Uint32Array(n),
    live: new Uint8Array(n),
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
    const i = p * 4;
    // little-endian RGBA; grains are near-opaque so they read as grain, not as a soft copy
    f.col[k] = ((235 << 24) | (src[i + 2] << 16) | (src[i + 1] << 8) | src[i]) >>> 0;
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let field: Field | null = null;
    let raf = 0;
    let mix = 0; // 0 = picture, 1 = all grain
    let inside = false;
    let mx = -1e6;
    let my = -1e6;
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);

    // keep the canvas on top of the img's box
    const place = () => {
      canvas.style.left = `${img.offsetLeft}px`;
      canvas.style.top = `${img.offsetTop}px`;
      canvas.style.width = `${img.offsetWidth}px`;
      canvas.style.height = `${img.offsetHeight}px`;
    };
    place();
    const ro = new ResizeObserver(() => {
      place();
      field = null; // rebuild at the new size on next hover
    });
    ro.observe(img);

    const ensure = () => {
      if (field) return field;
      if (!img.complete || !img.naturalWidth || !img.offsetWidth) return null;
      field = buildField(img, img.offsetWidth, img.offsetHeight);
      if (field) {
        canvas.width = field.w;
        canvas.height = field.h;
      }
      return field;
    };

    // window point → grain-canvas point (undoing the parent's rotation)
    const toLocal = (cx: number, cy: number) => {
      const r = parent.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height / 2);
      const lx = dx * cos - dy * sin + parent.offsetWidth / 2 - img.offsetLeft;
      const ly = dx * sin + dy * cos + parent.offsetHeight / 2 - img.offsetTop;
      const s = field ? field.w / img.offsetWidth : Q;
      return [lx * s, ly * s] as const;
    };

    const draw = (f: Field) => {
      const { px, x, y, col, n, w, h } = f;
      px.fill(0);
      for (let k = 0; k < n; k++) {
        const gx = x[k] | 0;
        const gy = y[k] | 0;
        if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
        px[gy * w + gx] = col[k];
      }
      ctx.putImageData(f.img, 0, 0);
    };

    const step = () => {
      raf = 0;
      const f = field;
      if (!f) return;
      mix += ((inside ? 1 : 0) - mix) * (inside ? 0.14 : 0.08);
      canvas.style.opacity = String(mix);
      img.style.opacity = String(1 - mix);

      const R = RADIUS * (f.w / img.offsetWidth);
      // wake every grain near the cursor
      if (inside) {
        const b0x = Math.max(0, ((mx - R) / BUCKET) | 0);
        const b1x = Math.min(f.bw - 1, ((mx + R) / BUCKET) | 0);
        const b0y = Math.max(0, ((my - R) / BUCKET) | 0);
        const b1y = Math.min(f.bh - 1, ((my + R) / BUCKET) | 0);
        for (let by = b0y; by <= b1y; by++)
          for (let bx = b0x; bx <= b1x; bx++) {
            const list = f.buckets[by * f.bw + bx];
            for (let j = 0; j < list.length; j++) f.live[list[j]] = 1;
          }
      }
      let moving = 0;
      const { x, y, vx, vy, hx, hy, live, n } = f;
      for (let k = 0; k < n; k++) {
        if (!live[k]) continue;
        let ax = (hx[k] - x[k]) * SPRING;
        let ay = (hy[k] - y[k]) * SPRING;
        if (inside) {
          const dx = x[k] - mx;
          const dy = y[k] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const t = 1 - d / R;
            const fpush = t * t * PUSH;
            ax += (dx / d) * fpush + (Math.random() - 0.5) * 0.6;
            ay += (dy / d) * fpush + (Math.random() - 0.5) * 0.6;
          }
        }
        vx[k] = (vx[k] + ax) * DAMP;
        vy[k] = (vy[k] + ay) * DAMP;
        x[k] += vx[k];
        y[k] += vy[k];
        const off = Math.abs(x[k] - hx[k]) + Math.abs(y[k] - hy[k]);
        if (off < 0.05 && Math.abs(vx[k]) + Math.abs(vy[k]) < 0.02) {
          x[k] = hx[k];
          y[k] = hy[k];
          vx[k] = vy[k] = 0;
          live[k] = 0;
        } else moving++;
      }
      if (mix > 0.004) draw(f);
      if (inside || moving || mix > 0.004) raf = requestAnimationFrame(step);
      else {
        mix = 0;
        canvas.style.opacity = "0";
        img.style.opacity = "";
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const f = ensure();
      if (!f) return;
      const [lx, ly] = toLocal(e.clientX, e.clientY);
      const gx = lx | 0;
      const gy = ly | 0;
      const hit =
        gx >= 0 && gy >= 0 && gx < f.w && gy < f.h && f.alpha[gy * f.w + gx] > 40;
      // something interactive drawn over the tomato (a sticker, a link, a popup, the bar) keeps
      // it whole — the tomatoes themselves never take the pointer
      const top = document.elementFromPoint(e.clientX, e.clientY);
      const covered = !!top?.closest("a, button, header, [role=dialog]");
      inside = hit && !covered;
      mx = lx;
      my = ly;
      if ((inside || mix > 0) && !raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => {
      inside = false;
      if (!raf && mix > 0) raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      cancelAnimationFrame(raf);
      img.style.opacity = "";
    };
  }, [rotate]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", pointerEvents: "none", opacity: 0 }}
    />
  );
}
