import Image from "next/image";
import { pastExperiences } from "@/data/site";
import pageStyles from "@/app/page.module.css";
import styles from "./PastExperiences.module.css";

/**
 * Past experiences (Figma 118:702, 118:828, 118:874): the serif section title, then each role as
 * a round logo beside an outlined pill (org name over role), centred rows that wrap — five over
 * four at the Figma width.
 */
export default function PastExperiences() {
  return (
    <section
      id="past-experiences"
      aria-labelledby="past-experiences-title"
      className={styles.section}
    >
      <h2 id="past-experiences-title" className={pageStyles.sectionTitle}>
        Past experiences
      </h2>
      <ul className={styles.list}>
        {pastExperiences.map((x) => (
          <li key={x.org} className={styles.item}>
            <Image
              src={x.logo}
              alt=""
              width={210}
              height={210}
              className={styles.logo}
            />
            <span className={styles.pill}>
              <span className={styles.org}>{x.org}</span>
              <span className={styles.role}>{x.role}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
