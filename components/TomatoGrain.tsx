"use client";

import { useEffect, useRef } from "react";

/**
 * The tomato with a fine film grain, drawn at the screen's real pixel density (so the grain is
 * a single device pixel). On hover, the fruit under the cursor is gently pushed outward and
 * dissolves, grain by grain, toward the page — nearly see-through right under the pointer, with
 * a soft edge — then heals smoothly once the cursor moves on.
 *
 * Under the hood: a coarse "wear" field follows the cursor (rising fast, healing slowly); each
 * pixel looks it up with bilinear smoothing, shifts its source a little away from the cursor and
 * drops out when a fixed per-pixel noise value falls under the wear. Only the worn area is redrawn.
 *
 * Drop it in right after the tomato's <img>, inside the same positioned parent. It copies the
 * img's box, so it inherits any rotation on that parent; pass that rotation (degrees) as
 * `rotate` so the cursor can be mapped into the tomato's own coordinates.
 */
const MAX_PIXELS = 2_400_000; // cap per tomato (keeps memory and redraws in check)
const GRAIN_L = 0.07; // grain: brightness wobble per pixel…
const GRAIN_A = 0.1; // …and opacity wobble
const RADIUS = 105; // CSS px around the cursor that dissolves
const PEAK = 0.9; // how worn the very centre gets (1 = fully gone)
const RISE = 0.22; // per-frame easing as the cursor arrives…
const HEAL = 0.05; // …and as the tomato heals behind it
const PUSH = 9; // CSS px the fruit is nudged outward at the centre
const CELL = 8; // canvas px per wear-field cell
const NOISE = 256; // tiled noise size

let noiseTile: Float32Array | null = null;
function getNoise() {
  if (noiseTile) return noiseTile;
  noiseTile = new Float32Array(NOISE * NOISE);
  for (let i = 0; i < noiseTile.length; i++) noiseTile[i] = Math.random();
  return noiseTile;
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
    const noise = getNoise();

    // state for the current size
    let w = 0;
    let h = 0;
    let scale = 1; // canvas px per CSS px
    let base: Uint8ClampedArray | null = null; // grained tomato, at rest
    let out: ImageData | null = null; // what's on screen
    let gw = 0;
    let gh = 0;
    let wear = new Float32Array(0);
    let touched = new Uint8Array(0);
    let active: number[] = []; // cells with any wear
    let raf = 0;
    let near = false;
    let mx = -1e6;
    let my = -1e6;
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);

    const build = () => {
      const cw = img.offsetWidth;
      const ch = img.offsetHeight;
      if (!img.complete || !img.naturalWidth || !cw || !ch) return;
      canvas.style.left = `${img.offsetLeft}px`;
      canvas.style.top = `${img.offsetTop}px`;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let s = dpr;
      if (cw * ch * s * s > MAX_PIXELS) s = Math.sqrt(MAX_PIXELS / (cw * ch));
      const nw = Math.round(cw * s);
      const nh = Math.round(ch * s);
      if (base && nw === w && nh === h) return;
      w = nw;
      h = nh;
      scale = s;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      try {
        ctx.drawImage(img, 0, 0, w, h);
      } catch {
        return;
      }
      const data = ctx.getImageData(0, 0, w, h);
      const d = data.data;
      // bake the grain in: every pixel's brightness and opacity wobble a touch
      for (let y = 0, i = 0; y < h; y++) {
        const row = (y & (NOISE - 1)) * NOISE;
        const row2 = ((y * 5 + 97) & (NOISE - 1)) * NOISE;
        for (let x = 0; x < w; x++, i += 4) {
          if (!d[i + 3]) continue;
          const n = noise[row + (x & (NOISE - 1))];
          const m = noise[row2 + ((x * 3 + 41) & (NOISE - 1))];
          const l = 1 + (n - 0.5) * 2 * GRAIN_L;
          d[i] = d[i] * l;
          d[i + 1] = d[i + 1] * l;
          d[i + 2] = d[i + 2] * l;
          d[i + 3] = d[i + 3] * (1 + (m - 0.5) * 2 * GRAIN_A);
        }
      }
      base = new Uint8ClampedArray(d);
      out = data;
      ctx.putImageData(out, 0, 0);
      gw = Math.ceil(w / CELL) + 1;
      gh = Math.ceil(h / CELL) + 1;
      wear = new Float32Array(gw * gh);
      touched = new Uint8Array(gw * gh);
      active = [];
      // the grained tomato takes over from the picture (same colours: a seamless swap)
      canvas.style.opacity = "1";
      img.style.visibility = "hidden";
    };
    let idle = 0;
    const cancelIdle = () => {
      if (!idle) return;
      (window.cancelIdleCallback ?? window.clearTimeout)(idle);
      idle = 0;
    };
    const schedule = () => {
      cancelIdle();
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 60));
      idle = ric(() => {
        idle = 0;
        build();
      }) as unknown as number;
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
      return [
        (dx * cos - dy * sin + parent.offsetWidth / 2 - img.offsetLeft) * scale,
        (dx * sin + dy * cos + parent.offsetHeight / 2 - img.offsetTop) * scale,
      ] as const;
    };

    const wearAt = (x: number, y: number) => {
      // bilinear over cell corners → a smooth gradient, no blocky steps
      const fx = x / CELL;
      const fy = y / CELL;
      const ix = fx | 0;
      const iy = fy | 0;
      const tx = fx - ix;
      const ty = fy - iy;
      const i = iy * gw + ix;
      const a = wear[i];
      const b = wear[i + 1];
      const c = wear[i + gw];
      const e = wear[i + gw + 1];
      return (a + (b - a) * tx) * (1 - ty) + (c + (e - c) * tx) * ty;
    };

    const step = () => {
      raf = 0;
      if (!base || !out) return;
      const R = RADIUS * scale;
      const push = PUSH * scale;
      // 1 · grow wear around the cursor, heal it everywhere else
      if (near) {
        const c0x = Math.max(0, Math.floor((mx - R) / CELL));
        const c1x = Math.min(gw - 1, Math.ceil((mx + R) / CELL));
        const c0y = Math.max(0, Math.floor((my - R) / CELL));
        const c1y = Math.min(gh - 1, Math.ceil((my + R) / CELL));
        for (let cy = c0y; cy <= c1y; cy++)
          for (let cx = c0x; cx <= c1x; cx++) {
            const k = cy * gw + cx;
            if (wear[k] === 0) {
              wear[k] = 1e-6;
              active.push(k);
            }
          }
      }
      const still: number[] = [];
      for (const k of active) {
        const cx = k % gw;
        const cy = (k - cx) / gw;
        let target = 0;
        if (near) {
          const dx = cx * CELL - mx;
          const dy = cy * CELL - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < R) {
            const t = 1 - d / R;
            target = t * t * (3 - 2 * t) * PEAK;
          }
        }
        const v = wear[k] + (target - wear[k]) * (target > wear[k] ? RISE : HEAL);
        if (v < 0.003 && target === 0) wear[k] = 0;
        else {
          wear[k] = v;
          still.push(k);
        }
        // the cells this corner value feeds (bilinear reaches one cell up/left)
        for (let oy = -1; oy <= 0; oy++)
          for (let ox = -1; ox <= 0; ox++) {
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx >= 0 && ny >= 0 && nx < gw && ny < gh) touched[ny * gw + nx] = 1;
          }
      }
      active = still;

      // 2 · redraw the touched cells
      const o = out.data;
      const src = base;
      let x0 = w;
      let y0 = h;
      let x1 = -1;
      let y1 = -1;
      for (let k = 0; k < touched.length; k++) {
        if (!touched[k]) continue;
        touched[k] = 0;
        const cx = k % gw;
        const cy = (k - cx) / gw;
        const px0 = cx * CELL;
        const py0 = cy * CELL;
        if (px0 >= w || py0 >= h) continue;
        const px1 = Math.min(w, px0 + CELL);
        const py1 = Math.min(h, py0 + CELL);
        if (px0 < x0) x0 = px0;
        if (py0 < y0) y0 = py0;
        if (px1 > x1) x1 = px1;
        if (py1 > y1) y1 = py1;
        for (let y = py0; y < py1; y++) {
          const row = (y & (NOISE - 1)) * NOISE;
          for (let x = px0; x < px1; x++) {
            const i = (y * w + x) * 4;
            const e = wearAt(x, y);
            if (e < 0.002) {
              o[i] = src[i];
              o[i + 1] = src[i + 1];
              o[i + 2] = src[i + 2];
              o[i + 3] = src[i + 3];
              continue;
            }
            // pushed outward: show the fruit from a little closer to the cursor
            let sx = x;
            let sy = y;
            const dx = x - mx;
            const dy = y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.5) {
              const m = (e * push) / dist;
              sx = Math.min(w - 1, Math.max(0, (x - dx * m + 0.5) | 0));
              sy = Math.min(h - 1, Math.max(0, (y - dy * m + 0.5) | 0));
            }
            const j = (sy * w + sx) * 4;
            // dissolve: this pixel drops out once the wear passes its own noise value
            const n = noise[row + (x & (NOISE - 1))];
            let keep = (n - (e * 1.15 - 0.15)) / 0.15;
            keep = keep < 0 ? 0 : keep > 1 ? 1 : keep;
            o[i] = src[j];
            o[i + 1] = src[j + 1];
            o[i + 2] = src[j + 2];
            o[i + 3] = src[j + 3] * keep * (1 - 0.3 * e);
          }
        }
      }
      if (x1 > x0) ctx.putImageData(out, 0, 0, x0, y0, x1 - x0, y1 - y0);
      if (near || active.length) raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !base) return;
      const [lx, ly] = toLocal(e.clientX, e.clientY);
      const R = RADIUS * scale;
      const inBox = lx > -R && ly > -R && lx < w + R && ly < h + R;
      // something interactive drawn over the tomato (a sticker, a link, a popup, the bar)
      const top = inBox ? document.elementFromPoint(e.clientX, e.clientY) : null;
      const covered = !!top?.closest("a, button, header, [role=dialog]");
      near = inBox && !covered;
      mx = lx;
      my = ly;
      if ((near || active.length) && !raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => {
      near = false;
      if (!raf && active.length) raf = requestAnimationFrame(step);
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
      style={{ position: "absolute", pointerEvents: "none", opacity: 0 }}
    />
  );
}
