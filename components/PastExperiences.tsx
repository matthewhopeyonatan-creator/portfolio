import { pastExperiences } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./PastExperiences.module.css";

/**
 * Past experiences (Figma 141:151): the section title (same as the others, centred), then every role as a row
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
      <h2
        id="past-experiences-title"
        className={`${pageStyles.sectionTitle} ${styles.title}`}
        data-reveal="up"
      >
        Past experiences
      </h2>
      <ul className={styles.list}>
        {pastExperiences.map((x) => (
          // each row rises as it's about to come on screen (both columns together)
          <li key={x.org} className={styles.item} data-reveal="up" data-reveal-early>
            <span className={styles.dates}>{x.dates}</span>
            <span className={styles.role}>{x.role}</span>
            <span className={styles.org}>{x.org}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
