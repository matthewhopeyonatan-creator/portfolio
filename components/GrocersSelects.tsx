import Image from "next/image";
import { grocersSelects } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./GrocersSelects.module.css";

/**
 * Grocer's Selects (Figma 111:697): the graphics shelf. Title row like Seasonal Picks, then the
 * screen split into three equal columns by 2px ink rules that run edge to edge and meet; each
 * poster sits with the same space on all four sides, its name and price under it.
 */
export default function GrocersSelects() {
  return (
    <section id="grocers-selects" aria-labelledby="grocers-selects-title">
      <div className={`${pageStyles.sectionTitleRow} ${styles.titleRow}`}>
        <h2 id="grocers-selects-title" className={pageStyles.sectionTitle}>
          Grocer’s selects
        </h2>
      </div>
      <ul className={styles.grid}>
        {grocersSelects.map((item) => (
          <li key={item.src} className={styles.cell}>
            <figure className={styles.item}>
              {item.video ? (
                <video
                  className={styles.poster}
                  poster={item.src}
                  width={742}
                  height={988}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${item.title} — ${item.source}`}
                >
                  <source
                    src={item.video.replace(/\.mp4$/, ".webm")}
                    type="video/webm"
                  />
                  <source src={item.video} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={item.src}
                  alt={`${item.title} — ${item.source}`}
                  width={742}
                  height={988}
                  sizes="(max-width: 767px) 80vw, 22vw"
                  className={styles.poster}
                />
              )}
              <figcaption className={styles.caption}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.price}>{item.price}</span>
                <span className={styles.source}>{item.source}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className={styles.more}>
        <a href="https://matthew-hope.com/#pantry">See full catalog</a>
      </p>
    </section>
  );
}
