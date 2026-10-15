import Image from "next/image";
import styles from "./Hero.module.css";

/**
 * Tomato artwork. Positions are the Figma render bounds (design px, relative to the hero's top-left,
 * i.e. frame y - 131), so each image lands exactly where it sits in the frame.
 * Layer order matches Figma: small (back) → right → left (front).
 */
const tomatoes = [
  { key: "small", src: "/home/tomato-small.webp", w: 1243, h: 1290, x: 948.68, y: 87.74, dw: 621.5, dh: 645, opacity: 0.7 },
  { key: "right", src: "/home/tomato-right.webp", w: 1239, h: 1347, x: 1108.82, y: 299.84, dw: 619.5, dh: 673.5, opacity: 1 },
  { key: "left", src: "/home/tomato-left.webp", w: 1436, h: 1697, x: 0, y: 151.44, dw: 718, dh: 848.5, opacity: 1 },
];

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Intro">
      <h1 className="visually-hidden">Matthew Hope, product designer</h1>
      <div className={styles.canvas} aria-hidden="true">
        {tomatoes.map((t) => (
          <Image
            key={t.key}
            src={t.src}
            alt=""
            width={t.w}
            height={t.h}
            priority
            sizes="42vw"
            className={styles.tomato}
            style={
              {
                "--x": t.x,
                "--y": t.y,
                "--w": t.dw,
                "--h": t.dh,
                opacity: t.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </section>
  );
}
