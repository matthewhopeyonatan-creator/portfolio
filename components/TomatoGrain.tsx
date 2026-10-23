"use client";

import { useEffect, useRef } from "react";

/**
 * The tomato with a fine film grain, drawn at the screen's real pixel density. On hover the
 * grains themselves are pushed: everything near the cursor breaks loose into particles (each
 * keeps its own colour), gets shoved out from under the pointer and dragged along with its
 * motion — so the page shows through where they've left and they bank up around the edge —
 * then, after a beat, they spring back home and the tomato knits itself together again.
 *
 * Only the disturbed area is simulated: the tomato is split into small cells, a cell turns into
 * particles the first time the cursor comes near, and turns back into plain pixels once all of
 * its grains are home.
 *
 * Drop it in right after the tomato's <img>, inside the same positioned parent. It copies the
 * img's box, so it inherits any rotation on that parent; pass that rotation (degrees) as
 * `rotate` so the cursor can be mapped into the tomato's own coordinates.
 */
const MAX_PIXELS = 2_400_000; // canvas cap per tomato
const GRAIN_L = 0.07; // baked-in grain: brightness wobble per pixel…
const GRAIN_A = 0.1; // …and opacity wobble
const RADIUS = 85; // CSS px: how far from the cursor grains get shoved
const LENS = 0.6; // grains right under the cursor are shoved this share of RADIUS outward…
const DRAG = 0.28; // …plus this share of the cursor's own motion
const GRAB = 0.16; // how briskly grains get out of the way
const DAMP = 0.8;
const HOLD = 16; // frames a grain waits after its last shove before heading home
const RAMP = 40; // frames over which the pull home builds up (so the return eases in)
const SPRING = 0.035;
const CELL = 8; // canvas px per cell
const MAX_PARTICLES = 220_000; // per tomato, allocated on first hover
const NOISE = 256;

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

    let w = 0;
    let h = 0;
    let scale = 1; // canvas px per CSS px
    let B = 1; // particle size in canvas px (one CSS px on dense screens)
    let base: Uint32Array | null = null; // grained tomato at rest (RGBA packed)
    let out: ImageData | null = null;
    let o32 = new Uint32Array(0);
    let gw = 0;
    let gh = 0;
    // cells
    let liquid = new Uint8Array(0); // 1 = currently particles
    let cStart = new Int32Array(0); // first particle of the cell
    let cLen = new Int32Array(0); // particle count
    let cAwake = new Int32Array(0); // particles not yet home
    let dirty = new Uint8Array(0);
    let liquidCells: number[] = [];
    // particles (struct of arrays)
    let n = 0;
    let dead = 0;
    let hx = new Float32Array(0);
    let hy = new Float32Array(0);
    let x = new Float32Array(0);
    let y = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let quiet = new Uint16Array(0);
    let str = new Float32Array(0); // per-grain push strength, so the parting has a ragged, grainy edge
    let home = new Uint8Array(0); // 1 = resting at home
    let gone = new Uint8Array(0); // 1 = removed (cell went solid again)
    let pcell = new Int32Array(0);
    let col = new Uint32Array(0); // B*B colours per particle

    let raf = 0;
    let near = false;
    let mx = -1e6;
    let my = -1e6;
    let pmx = -1e6;
    let pmy = -1e6;
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);

    const alloc = () => {
      const cap = MAX_PARTICLES;
      hx = new Float32Array(cap);
      hy = new Float32Array(cap);
      x = new Float32Array(cap);
      y = new Float32Array(cap);
      vx = new Float32Array(cap);
      vy = new Float32Array(cap);
      quiet = new Uint16Array(cap);
      str = new Float32Array(cap);
      home = new Uint8Array(cap);
      gone = new Uint8Array(cap);
      pcell = new Int32Array(cap);
      col = new Uint32Array(cap * B * B);
      n = 0;
      dead = 0;
    };

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
      B = s >= 1.5 ? 2 : 1;
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
      for (let yy = 0, i = 0; yy < h; yy++) {
        const row = (yy & (NOISE - 1)) * NOISE;
        const row2 = ((yy * 5 + 97) & (NOISE - 1)) * NOISE;
        for (let xx = 0; xx < w; xx++, i += 4) {
          if (!d[i + 3]) continue;
          const l = 1 + (noise[row + (xx & (NOISE - 1))] - 0.5) * 2 * GRAIN_L;
          d[i] = d[i] * l;
          d[i + 1] = d[i + 1] * l;
          d[i + 2] = d[i + 2] * l;
          d[i + 3] =
            d[i + 3] * (1 + (noise[row2 + ((xx * 3 + 41) & (NOISE - 1))] - 0.5) * 2 * GRAIN_A);
        }
      }
      base = new Uint32Array(new Uint8ClampedArray(d).buffer);
      out = data;
      o32 = new Uint32Array(out.data.buffer);
      ctx.putImageData(out, 0, 0);
      gw = Math.ceil(w / CELL);
      gh = Math.ceil(h / CELL);
      liquid = new Uint8Array(gw * gh);
      cStart = new Int32Array(gw * gh);
      cLen = new Int32Array(gw * gh);
      cAwake = new Int32Array(gw * gh);
      dirty = new Uint8Array(gw * gh);
      liquidCells = [];
      n = 0;
      dead = 0;
      hx = new Float32Array(0); // (re)allocated on first hover at this size
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

    const toLocal = (cx: number, cy: number) => {
      const r = parent.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height / 2);
      return [
        (dx * cos - dy * sin + parent.offsetWidth / 2 - img.offsetLeft) * scale,
        (dx * sin + dy * cos + parent.offsetHeight / 2 - img.offsetTop) * scale,
      ] as const;
    };

    // a cell breaks loose: each B×B block with any colour becomes one particle
    const liquefy = (c: number) => {
      if (!base || liquid[c]) return;
      if (!hx.length) alloc();
      const cx = c % gw;
      const cy = (c - cx) / gw;
      const x0 = cx * CELL;
      const y0 = cy * CELL;
      const x1 = Math.min(w, x0 + CELL);
      const y1 = Math.min(h, y0 + CELL);
      const start = n;
      for (let by = y0; by < y1; by += B)
        for (let bx = x0; bx < x1; bx += B) {
          if (n >= MAX_PARTICLES) break;
          let any = 0;
          const ci = n * B * B;
          for (let oy = 0; oy < B; oy++)
            for (let ox = 0; ox < B; ox++) {
              const px = bx + ox;
              const py = by + oy;
              const v = px < w && py < h ? base[py * w + px] : 0;
              col[ci + oy * B + ox] = v;
              any |= v >>> 24;
            }
          if (!any) continue;
          hx[n] = x[n] = bx;
          hy[n] = y[n] = by;
          vx[n] = vy[n] = 0;
          quiet[n] = 0;
          home[n] = 0;
          gone[n] = 0;
          pcell[n] = c;
          str[n] = 0.25 + Math.random() * 0.95;
          n++;
        }
      const len = n - start;
      if (!len) return;
      liquid[c] = 1;
      cStart[c] = start;
      cLen[c] = len;
      cAwake[c] = len;
      liquidCells.push(c);
    };

    // squeeze out removed particles once they pile up (cells keep contiguous ranges)
    const compact = () => {
      let j = 0;
      const BB = B * B;
      for (const c of liquidCells) {
        const s0 = cStart[c];
        const len = cLen[c];
        cStart[c] = j;
        for (let k = s0; k < s0 + len; k++, j++) {
          if (k === j) continue;
          hx[j] = hx[k];
          hy[j] = hy[k];
          x[j] = x[k];
          y[j] = y[k];
          vx[j] = vx[k];
          vy[j] = vy[k];
          quiet[j] = quiet[k];
          str[j] = str[k];
          home[j] = home[k];
          gone[j] = 0;
          pcell[j] = c;
          col.copyWithin(j * BB, k * BB, k * BB + BB);
        }
      }
      n = j;
      dead = 0;
    };

    const markDirty = (px: number, py: number) => {
      const cx = (px / CELL) | 0;
      const cy = (py / CELL) | 0;
      if (cx >= 0 && cy >= 0 && cx < gw && cy < gh) dirty[cy * gw + cx] = 1;
    };

    const step = () => {
      raf = 0;
      if (!base || !out) return;
      const R = RADIUS * scale;
      const R2 = R * R;
      
      // 1 · break loose every cell along the cursor's path since last frame
      let cvx = 0;
      let cvy = 0;
      if (near) {
        const sx = pmx > -1e5 ? pmx : mx;
        const sy = pmy > -1e5 ? pmy : my;
        cvx = mx - sx;
        cvy = my - sy;
        const len = Math.hypot(cvx, cvy);
        const steps = Math.max(1, Math.ceil(len / (R * 0.3)));
        for (let s = 1; s <= steps; s++) {
          const px = sx + (cvx * s) / steps;
          const py = sy + (cvy * s) / steps;
          const c0x = Math.max(0, Math.floor((px - R) / CELL));
          const c1x = Math.min(gw - 1, Math.floor((px + R) / CELL));
          const c0y = Math.max(0, Math.floor((py - R) / CELL));
          const c1y = Math.min(gh - 1, Math.floor((py + R) / CELL));
          for (let cy = c0y; cy <= c1y; cy++)
            for (let cx = c0x; cx <= c1x; cx++) {
              const c = cy * gw + cx;
              if (liquid[c]) continue;
              const ddx = (cx + 0.5) * CELL - px;
              const ddy = (cy + 0.5) * CELL - py;
              if (ddx * ddx + ddy * ddy < (R + CELL) * (R + CELL)) liquefy(c);
            }
        }
        // the cursor's own motion, clamped so a flick doesn't fling the fruit apart
        const vl = Math.hypot(cvx, cvy);
        const vmax = R * 0.25;
        if (vl > vmax) {
          cvx *= vmax / vl;
          cvy *= vmax / vl;
        }
        pmx = mx;
        pmy = my;
      } else {
        pmx = pmy = -1e6;
      }

      // 2 · move the loose grains
      for (const c of liquidCells) dirty[c] = 1;
      const restored: number[] = [];
      for (let k = 0; k < n; k++) {
        if (gone[k]) continue;
        if (home[k] && !near) continue;
        // where this grain wants to be: shoved outward (by how close its home is to the cursor),
        // or back home once the cursor has gone and it has waited a beat
        let gxT = hx[k];
        let gyT = hy[k];
        let kk = 0;
        let pushed = false;
        if (near) {
          const dx = hx[k] - mx;
          const dy = hy[k] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / R;
            const u = R * LENS * f * f * str[k];
            gxT += (dx / d) * u;
            gyT += (dy / d) * u;
            vx[k] += cvx * DRAG * f;
            vy[k] += cvy * DRAG * f;
            kk = GRAB;
            pushed = true;
          }
        }
        if (pushed) {
          if (home[k]) {
            home[k] = 0;
            cAwake[pcell[k]]++;
          }
          quiet[k] = 0;
        } else {
          if (home[k]) continue;
          if (quiet[k] < 65000) quiet[k]++;
          // the pull home only starts after a beat, then eases in
          const q = quiet[k] - HOLD;
          kk = q <= 0 ? 0 : SPRING * Math.min(1, q / RAMP);
        }
        const ox = x[k];
        const oy = y[k];
        vx[k] = (vx[k] + (gxT - ox) * kk) * DAMP;
        vy[k] = (vy[k] + (gyT - oy) * kk) * DAMP;
        x[k] = ox + vx[k];
        y[k] = oy + vy[k];
        markDirty(ox, oy);
        markDirty(x[k], y[k]);
        if (
          !pushed &&
          kk > 0 &&
          Math.abs(x[k] - hx[k]) + Math.abs(y[k] - hy[k]) < 0.3 &&
          Math.abs(vx[k]) + Math.abs(vy[k]) < 0.08
        ) {
          x[k] = hx[k];
          y[k] = hy[k];
          vx[k] = vy[k] = 0;
          home[k] = 1;
          const c = pcell[k];
          if (--cAwake[c] === 0) restored.push(c);
        }
      }
      // cells whose grains are all home go back to plain pixels
      if (restored.length) {
        for (const c of restored) {
          if (cAwake[c] !== 0 || !liquid[c]) continue;
          liquid[c] = 0;
          for (let k = cStart[c]; k < cStart[c] + cLen[c]; k++) gone[k] = 1;
          dead += cLen[c];
          dirty[c] = 1;
        }
        liquidCells = liquidCells.filter((c) => liquid[c]);
        if (dead > 40_000 && dead > n / 2) compact();
        if (!liquidCells.length) {
          n = 0;
          dead = 0;
        }
      }

      // 3 · redraw: dirty cells back to the tomato (solid) or empty (loose), then splat the grains
      let x0 = w;
      let y0 = h;
      let x1 = -1;
      let y1 = -1;
      for (let c = 0; c < dirty.length; c++) {
        if (!dirty[c]) continue;
        const cx = c % gw;
        const cy = (c - cx) / gw;
        const px0 = cx * CELL;
        const py0 = cy * CELL;
        const px1 = Math.min(w, px0 + CELL);
        const py1 = Math.min(h, py0 + CELL);
        if (px0 < x0) x0 = px0;
        if (py0 < y0) y0 = py0;
        if (px1 > x1) x1 = px1;
        if (py1 > y1) y1 = py1;
        for (let yy = py0; yy < py1; yy++) {
          const a = yy * w + px0;
          const b = yy * w + px1;
          if (liquid[c]) o32.fill(0, a, b);
          else o32.set(base.subarray(a, b), a);
        }
      }
      if (x1 >= 0) {
        const BB = B * B;
        const od = out.data;
        for (let k = 0; k < n; k++) {
          if (gone[k]) continue;
          const gx = (x[k] + 0.5) | 0;
          const gy = (y[k] + 0.5) | 0;
          if (gx < 0 || gy < 0 || gx + B > w || gy + B > h) continue;
          if (!dirty[((gy / CELL) | 0) * gw + ((gx / CELL) | 0)]) continue;
          const ci = k * BB;
          // a grain that's been moved draws one px larger, so no hairline gaps open up between
          // neighbours that moved by slightly different amounts
          const S = gx === hx[k] && gy === hy[k] ? B : B + 1;
          if (gx + S > w || gy + S > h) continue;
          for (let oy = 0; oy < S; oy++)
            for (let ox = 0; ox < S; ox++) {
              const c = col[ci + (oy < B ? oy : B - 1) * B + (ox < B ? ox : B - 1)];
              const sa = c >>> 24;
              if (!sa) continue;
              const p = (gy + oy) * w + gx + ox;
              const da = o32[p] >>> 24;
              if (!da) {
                o32[p] = c;
                continue;
              }
              // grains banking up over each other: plain "over" blend
              const i = p * 4;
              const a = sa / 255;
              const ra = a + (da / 255) * (1 - a);
              const kd = ((da / 255) * (1 - a)) / ra;
              od[i] = (c & 255) * (a / ra) + od[i] * kd;
              od[i + 1] = ((c >>> 8) & 255) * (a / ra) + od[i + 1] * kd;
              od[i + 2] = ((c >>> 16) & 255) * (a / ra) + od[i + 2] * kd;
              od[i + 3] = ra * 255;
            }
        }
        dirty.fill(0);
        ctx.putImageData(out, 0, 0, x0, y0, x1 - x0, y1 - y0);
      }
      if (near || liquidCells.length) raf = requestAnimationFrame(step);
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
      if ((near || liquidCells.length) && !raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => {
      near = false;
      if (!raf && liquidCells.length) raf = requestAnimationFrame(step);
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
