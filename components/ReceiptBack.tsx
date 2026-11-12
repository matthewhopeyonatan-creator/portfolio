"use client";

import { Camera, RotateCcw, RefreshCw } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import useMarker from "@/components/useMarker";
import styles from "./ReceiptBack.module.css";

/**
 * The back of the receipt (Figma 504:4934): a photobooth. The grey square takes a photo — on a
 * phone it opens the camera / photo library; with a mouse it offers the webcam (3-2-1, flash) or
 * an upload — and prints it onto the slip like a thermal receipt: black and white, grainy,
 * dithered, with a little banding (receiptify). Below, the shop's name and a thank-you; two blurred
 * tomatoes peek in from the corners. It has its own marker, so people can draw on this side too.
 * The photo is kept for the visit (sessionStorage) so a refresh doesn't lose it.
 */

const PHOTO_KEY = "hg-receipt-photo";
const N = 400; // the printed photo's resolution: coarse enough that the dither reads as grain

/** Print an image the way a receipt printer would: grey, levels stretched, grain, a little row
 *  banding, then Floyd–Steinberg dithered to one bit. Dark dots are the ink (#282828), the rest
 *  is left clear so the slip's paper shows through. */
function receiptify(src: CanvasImageSource, sw: number, sh: number, mirror = false): string {
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  // cover-crop to the square
  const s = Math.min(sw, sh);
  const sx = (sw - s) / 2;
  const sy = (sh - s) / 2;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, N, N);
  if (mirror) {
    g.translate(N, 0);
    g.scale(-1, 1);
  }
  g.drawImage(src, sx, sy, s, s, 0, 0, N, N);
  const img = g.getImageData(0, 0, N, N);
  const d = img.data;
  const lum = new Float32Array(N * N);
  const hist = new Uint32Array(256);
  for (let i = 0; i < N * N; i++) {
    const y = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    lum[i] = y;
    hist[Math.round(y)]++;
  }
  // stretch the levels between the 2nd and 98th percentile, so dim photos still print
  const pick = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= p * N * N) return v;
    return 255;
  };
  const lo = pick(0.02);
  const hi = Math.max(lo + 1, pick(0.98));
  for (let row = 0; row < N; row++) {
    // thermal heads band a little: the odd row prints a touch lighter or darker
    const band = Math.random() < 0.08 ? (Math.random() - 0.5) * 40 : 0;
    for (let x = 0; x < N; x++) {
      const i = row * N + x;
      let v = ((lum[i] - lo) / (hi - lo)) * 255;
      v = 255 * Math.pow(Math.min(1, Math.max(0, v / 255)), 0.8); // lift the mids so faces don't go muddy
      v = (v - 128) * 1.15 + 128; // a little more contrast
      v += (Math.random() - 0.5) * 60 + band; // grain
      lum[i] = v;
    }
  }
  // Floyd–Steinberg to one bit
  for (let row = 0; row < N; row++) {
    for (let x = 0; x < N; x++) {
      const i = row * N + x;
      const old = lum[i];
      const on = old < 128; // ink
      const err = old - (on ? 0 : 255);
      if (x + 1 < N) lum[i + 1] += (err * 7) / 16;
      if (row + 1 < N) {
        if (x > 0) lum[i + N - 1] += (err * 3) / 16;
        lum[i + N] += (err * 5) / 16;
        if (x + 1 < N) lum[i + N + 1] += err / 16;
      }
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 40;
      d[i * 4 + 3] = on ? 255 : 0;
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

type Mode = "idle" | "choose" | "camera";

const ReceiptBack = forwardRef<
  HTMLDivElement,
  { className?: string; hidden: boolean; download: React.ReactNode; inert?: boolean }
>(function ReceiptBack({ className = "", hidden, download, inert }, ref) {
  const marker = useMarker();
  const [photo, setPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [count, setCount] = useState(0); // the 3-2-1 before the webcam snaps
  const [flash, setFlash] = useState(0);
  const file = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(PHOTO_KEY);
      if (saved) setPhoto(saved);
    } catch {}
  }, []);

  const keep = (url: string) => {
    setPhoto(url);
    setFlash((f) => f + 1);
    try {
      window.sessionStorage.setItem(PHOTO_KEY, url);
    } catch {}
  };

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => stop, [stop]);
  // flipping away turns the camera off
  useEffect(() => {
    if (hidden) {
      stop();
      setMode("idle");
      setCount(0);
    }
  }, [hidden, stop]);

  const upload = () => file.current?.click();

  const start = async () => {
    // phones (and anything without a camera API): the system picker already offers camera or library
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch || !navigator.mediaDevices?.getUserMedia) return upload();
    setMode("choose");
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      stream.current = s;
      setMode("camera");
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = s;
          video.current.play().catch(() => {});
        }
      });
    } catch {
      // no camera, or permission refused: fall back to picking a file
      setMode("idle");
      upload();
    }
  };

  const snap = () => {
    if (count) return;
    let n = 3;
    setCount(n);
    const tick = window.setInterval(() => {
      n -= 1;
      if (n > 0) return setCount(n);
      window.clearInterval(tick);
      setCount(0);
      const v = video.current;
      if (v && v.videoWidth) keep(receiptify(v, v.videoWidth, v.videoHeight, true));
      stop();
      setMode("idle");
    }, 800);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      keep(receiptify(img, img.naturalWidth, img.naturalHeight));
      URL.revokeObjectURL(url);
      setMode("idle");
    };
    img.src = url;
  };

  const retake = () => {
    stop();
    setMode("idle");
    start();
  };

  return (
    <div ref={ref} className={`${styles.back} ${className}`} inert={inert} {...marker.handlers}>
      <canvas ref={marker.canvas} className={styles.ink} aria-hidden="true" />
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

      {/* the photo slot */}
      <div className={`${styles.square} ${photo && mode === "idle" ? styles.filled : ""}`}>
        {photo && mode === "idle" ? (
          <>
            {/* key: each new print fades in */}
            <img key={flash} className={styles.photo} src={photo} alt="Your photo, printed on the receipt" />
            <button
              type="button"
              className={styles.retake}
              onClick={retake}
              aria-label="Take another photo"
              title="Take another photo"
              data-no-snapshot
            >
              <RefreshCw aria-hidden="true" strokeWidth={2} />
            </button>
          </>
        ) : mode === "choose" ? (
          <div className={styles.choose}>
            <button type="button" className={styles.choice} onClick={openCamera}>
              <Camera aria-hidden="true" strokeWidth={1.75} />
              Take photo
            </button>
            <span className={styles.or}>or</span>
            <button type="button" className={styles.choice} onClick={upload}>
              Upload
            </button>
          </div>
        ) : mode === "camera" ? (
          <div className={styles.booth} data-no-draw>
            <video ref={video} className={styles.video} playsInline muted aria-label="Camera preview" />
            {count ? (
              <span key={count} className={styles.count} aria-live="assertive">
                {count}
              </span>
            ) : (
              <button type="button" className={styles.snap} onClick={snap}>
                snap
              </button>
            )}
          </div>
        ) : (
          <button type="button" className={styles.empty} onClick={start}>
            Upload or take photo
          </button>
        )}
        {flash ? <span key={`f${flash}`} className={styles.flash} aria-hidden="true" data-no-snapshot /> : null}
      </div>
      <input ref={file} type="file" accept="image/*" className={styles.file} onChange={onFile} tabIndex={-1} aria-hidden="true" />

      <p className={styles.logo} aria-label="hope’s grocer">
        <span className={styles.logoBold}>hope</span>
        <span className={styles.logoApostrophe}>’</span>
        <span className={styles.logoBold}>s grocer</span>
      </p>
      <p className={styles.thanks}>
        Thank you for stopping by :)
        <br />
        Come back anytime~
      </p>

      {/* two blurred tomatoes peeking in from the corners, over the photo and the border (Figma,
          cut at the slip's outer edge) */}
      <div className={styles.tomatoes} aria-hidden="true">
        {/* light and dark (blue, Figma's gradient map) stacked; the theme crossfades them */}
        <img className={`${styles.tomato} ${styles.tomatoLeft} ${styles.light}`} src="/receipt/back/tomato-left.svg" alt="" width={183} height={240} />
        <img className={`${styles.tomato} ${styles.tomatoLeft} ${styles.dark}`} src="/receipt/back/dark/tomato-left.webp" alt="" width={183} height={240} loading="lazy" />
        <img className={`${styles.tomato} ${styles.tomatoRight} ${styles.light}`} src="/receipt/back/tomato-right.svg" alt="" width={171} height={421} />
        <img className={`${styles.tomato} ${styles.tomatoRight} ${styles.dark}`} src="/receipt/back/dark/tomato-right.webp" alt="" width={171} height={421} loading="lazy" />
      </div>

      {download}
    </div>
  );
});

export default ReceiptBack;
