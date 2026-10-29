import AboutGallery from "@/components/AboutGallery";
import { RecsList, RecsMonth } from "@/components/ProduceRecs";
import styles from "./About.module.css";

/**
 * The about page (Figma 122:925, 1728 wide). Laid out in Figma px (--u) from the frame: intro,
 * MATTHEW HOPE, the drifting photo strip, the things that have
 * stuck with him, a design tip, and Produce Recs.
 */
const INTERESTS = ["cooking", "hiking", "graphic design", "hosting", "plants", "dancing", "travel"];

export default function About() {
  const month = new Date().getMonth(); // when the page was built (refreshed daily, app/about)
  return (
    <main className={styles.page}>
      <section className={styles.hello} aria-labelledby="about-name">
        <p className={styles.intro} data-reveal="up">
          Hi there, I’m a product designer that grew up in Jakarta, Indonesia. I take life through
          curiosity and the mindset to always be down to do something new. Hope you learn more about
          me here :)
        </p>
        <h1 id="about-name" className={styles.name} data-reveal="up">
          MATTHEW HOPE
        </h1>
      </section>

      <AboutGallery />

      <section className={styles.story}>
        <p className={styles.storyText} data-reveal="up">
          I like experiencing the most life has to give me, and I take inspiration from the places
          and people around me. Here are some things that have especially stuck with me
        </p>
        <ul className={styles.interests} data-reveal="up" style={{ "--i": 1 } as React.CSSProperties}>
          {INTERESTS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`${styles.snap} ${styles.snapInterests}`}
          src="/about/interests.webp"
          alt="Looking out over a canyon of orange rock spires"
          width={479}
          height={213}
          loading="lazy"
          data-reveal="up"
          style={{ "--i": 2 } as React.CSSProperties}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`${styles.snap} ${styles.snapSunset}`}
          src="/about/sunset.webp"
          alt="An orange sunset over the water"
          width={479}
          height={213}
          loading="lazy"
          data-reveal="up"
        />
        <p className={styles.tip} data-reveal="up" style={{ "--i": 1 } as React.CSSProperties}>
          My design tip:
          <br />
          always remember pause and look at the sunset
        </p>
      </section>

      <section className={styles.recs} aria-labelledby="produce-recs">
        <h2 id="produce-recs" className={styles.recsTitle} data-reveal="up">
          PRODUCE
          <br />
          RECS
        </h2>
        <RecsMonth initial={month} style={{ "--i": 1 } as React.CSSProperties} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`${styles.snap} ${styles.snapProduce}`}
          src="/about/produce.webp"
          alt="Heirloom and cherry tomatoes at a market stall"
          width={479}
          height={213}
          loading="lazy"
          data-reveal="up"
          style={{ "--i": 2 } as React.CSSProperties}
        />
      </section>

      <RecsList initial={month} />
    </main>
  );
}
