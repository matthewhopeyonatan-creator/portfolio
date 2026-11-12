"use client";

import { Camera, RotateCcw, RefreshCw } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import useMarker from "@/components/useMarker";
import styles from "./ReceiptBack.module.css";

/**
 * The back of the receipt (Figma 504:4934): a photobooth. The grey square takes a photo — on a
 * phone it opens the camera / photo library; with a mouse it offers the webcam (one press, a flash) or
 * an upload — and prints it onto the slip like a thermal receipt: black and white, contrasty,
 * with fine noise and a little banding (receiptify). Below, the shop's name and a thank-you; two blurred
 * tomatoes peek in from the corners. It has its own marker, so people can draw on this side too.
 * The photo lives only on the page: a reload starts with an empty square.
 */

const N = 720; // the printed photo's resolution: fine enough that the noise reads as grain

/** Print an image the way a receipt printer would: black and white, the levels stretched and
 *  the contrast pushed so faces read clearly, noise over the top, the odd faintly lighter or
 *  darker row where the print head bands, and a few thin white streaks where it skipped. Ink is #282828 (never pure black), paper white. */
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
  // stretch the levels between the 1st and 99th percentile, so dim photos still print
  const pick = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= p * N * N) return v;
    return 255;
  };
  const lo = pick(0.01);
  const hi = Math.max(lo + 1, pick(0.99));
  const INK = 40; // #282828
  // a few thin white lines where the print head skipped: rows (1–2px) printed almost blank
  const skips = new Set<number>();
  for (let k = 0, n = 4 + Math.floor(Math.random() * 4); k < n; k++) {
    const r = Math.floor(Math.random() * N);
    skips.add(r);
    if (Math.random() < 0.4) skips.add(r + 1);
  }
  for (let row = 0; row < N; row++) {
    const band = Math.random() < 0.06 ? (Math.random() - 0.5) * 18 : 0;
    const skip = skips.has(row);
    for (let x = 0; x < N; x++) {
      const i = row * N + x;
      let v = Math.min(1, Math.max(0, (lum[i] - lo) / (hi - lo)));
      v = v < 0.5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v); // S-curve: crisper blacks and whites
      let out = INK + v * (255 - INK);
      out += (Math.random() - 0.5) * 50 + band; // noise
      if (skip) out = out + (255 - out) * 0.82; // a white streak
      out = Math.min(255, Math.max(INK, out));
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = out;
      d[i * 4 + 3] = 255;
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/jpeg", 0.9);
}

type Mode = "idle" | "choose" | "camera";

const ReceiptBack = forwardRef<
  HTMLDivElement,
  { className?: string; hidden: boolean; download: React.ReactNode; inert?: boolean }
>(function ReceiptBack({ className = "", hidden, download, inert }, ref) {
  const marker = useMarker();
  const [photo, setPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [flash, setFlash] = useState(0);
  const file = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  // photos are never kept: a reload starts with an empty square. (Clears what an earlier version
  // of this page saved.)
  useEffect(() => {
    try {
      window.sessionStorage.removeItem("hg-receipt-photo");
    } catch {}
  }, []);

  const keep = (url: string) => {
    setPhoto(url);
    setFlash((f) => f + 1);
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

  // snaps straight away (with the flash)
  const snap = () => {
    const v = video.current;
    if (v && v.videoWidth) keep(receiptify(v, v.videoWidth, v.videoHeight, true));
    stop();
    setMode("idle");
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
            <button type="button" className={styles.snap} onClick={snap}>
              smile
            </button>
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
        {/* printed like the photo: black and white with noise (made from the Figma tomatoes) */}
        <img className={`${styles.tomato} ${styles.tomatoLeft}`} src="/receipt/back/tomato-left-bw.webp" alt="" width={183} height={240} />
        <img className={`${styles.tomato} ${styles.tomatoRight}`} src="/receipt/back/tomato-right-bw.webp" alt="" width={171} height={421} />
      </div>

      {download}
    </div>
  );
});

export default ReceiptBack;
