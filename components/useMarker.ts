"use client";

import { useCallback, useRef } from "react";

const INK = "#e82c2c"; // red felt-tip; drawn solid, the canvas itself is multiplied over the print (CSS)

/**
 * A red marker for drawing on the receipt: press anywhere on it (not in the Notes box or on a link)
 * and drag. Strokes are smoothed through the midpoints of the pointer's path, get a touch thinner
 * when you move fast (like a real felt-tip), and sit on a canvas laid over the slip — so they're in
 * the downloaded image too. The canvas follows the slip's size and keeps what's drawn.
 */
export default function useMarker() {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const stroke = useRef<{ id: number; pts: { x: number; y: number; t: number }[]; w: number } | null>(null);

  const ctx = () => cv.current?.getContext("2d") ?? null;

  // size the canvas to the slip (in device pixels), keeping whatever is already drawn
  const fit = useCallback(() => {
    const c = cv.current;
    const host = c?.parentElement; // the slip (the canvas's ref runs before the slip's own ref is set)
    if (!c || !host) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(host.clientWidth * dpr);
    const h = Math.round(host.clientHeight * dpr);
    if (c.width === w && c.height === h) return;
    const keep = c.width && c.height ? c.toDataURL() : null;
    c.width = w;
    c.height = h;
    if (keep) {
      const img = new Image();
      img.onload = () => ctx()?.drawImage(img, 0, 0, w, h);
      img.src = keep;
    }
  }, []);

  const canvas = useCallback(
    (node: HTMLCanvasElement | null) => {
      cv.current = node;
      if (!node) return;
      fit();
      if (node.parentElement) new ResizeObserver(fit).observe(node.parentElement);
    },
    [fit],
  );

  const point = (e: React.PointerEvent) => {
    const c = cv.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
      t: performance.now(),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || stroke.current || !cv.current) return;
    if ((e.target as HTMLElement).closest("textarea, button, a")) return;
    e.preventDefault(); // no text selection while drawing
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const c = cv.current;
    const base = (c.width / (c.clientWidth || 1)) * Math.max(5, c.clientWidth / 64); // ~7 css px, felt-tip
    const p = point(e);
    stroke.current = { id: e.pointerId, pts: [p], w: base };
    // a dot, so a single press still leaves a mark
    const g = ctx();
    if (g) {
      g.fillStyle = INK;
      g.beginPath();
      g.arc(p.x, p.y, base / 2, 0, Math.PI * 2);
      g.fill();
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = stroke.current;
    const g = ctx();
    if (!s || !g || e.pointerId !== s.id) return;
    const p = point(e);
    const pts = s.pts;
    const last = pts[pts.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 1) return;
    pts.push(p);
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineJoin = "round";
    if (pts.length === 2) {
      // join the opening dot to where the smoothed curve begins
      g.lineWidth = s.w;
      g.beginPath();
      g.moveTo(last.x, last.y);
      g.lineTo((last.x + p.x) / 2, (last.y + p.y) / 2);
      g.stroke();
      return;
    }
    const [a, b, c] = pts.slice(-3);
    // faster → a little thinner (down to 70%)
    const speed = Math.hypot(c.x - b.x, c.y - b.y) / Math.max(1, c.t - b.t);
    const w = s.w * Math.max(0.7, 1 - speed * 0.08);
    g.lineWidth = w;
    g.beginPath();
    g.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
    g.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
    g.stroke();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = stroke.current;
    if (!s || e.pointerId !== s.id) return;
    stroke.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const clear = () => {
    const c = cv.current;
    ctx()?.clearRect(0, 0, c?.width ?? 0, c?.height ?? 0);
  };

  return {
    canvas,
    clear,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
