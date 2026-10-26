import { pastExperiences } from "@/data/site";
import styles from "./PastExperiences.module.css";

/**
 * Past experiences (Figma 141:151): a bold title on the right margin, then every role as a row
 * under a 2px rule — dates on the left, the role on the right with the company large beneath it —
 * in two columns.
 */
export default function PastExperiences() {
  return (
    <section
      id="past-experiences"
      aria-labelledby="past-experiences-title"
      className={styles.section}
    >
      <h2 id="past-experiences-title" className={styles.title} data-reveal="up">
        Past experiences
      </h2>
      <ul className={styles.list}>
        {pastExperiences.map((x, i) => (
          <li
            key={x.org}
            className={styles.item}
            data-reveal="up"
            style={{ "--i": Math.floor(i / 2) * 0.6 + (i % 2) * 0.3 } as React.CSSProperties}
          >
            <span className={styles.dates}>{x.dates}</span>
            <span className={styles.role}>{x.role}</span>
            <span className={styles.org}>{x.org}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
