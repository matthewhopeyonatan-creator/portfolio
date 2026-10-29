import AboutGallery from "@/components/AboutGallery";
import CareerRows, { type CareerRow } from "@/components/CareerRows";
import { RecsList, RecsMonth } from "@/components/ProduceRecs";
import styles from "./About.module.css";

/**
 * The about page (Figma 122:925, 1728 wide). Laid out in Figma px (--u) from the frame: intro,
 * MATTHEW HOPE, the drifting photo strip, the things that have stuck with him, the sunset line,
 * experience and education, and Produce Recs.
 */
const INTERESTS = ["cooking", "hiking", "graphic design", "hosting", "plants", "dancing", "travel"];

// Figma 217:490 / 217:516 — newest first
const WORK: CareerRow[] = [
  { org: "25madison", role: "product design fellow", dates: "aug 26 - dec 26", logo: "/about/logos/25madison.webp",
    blurb: "Venture capital and investment firm incubating AI companies in legacy industries" },
  { org: "CrowdVolt (YC24)", role: "product design intern", dates: "dec 25 - aug 26", logo: "/about/logos/crowdvolt.webp",
    blurb: "YC-backed bid-ask marketplace for electronic music tickets, connecting buyers and sellers on a secure, community-driven platform" },
  { org: "The Philadelphia Inquirer", role: "contract product designer", dates: "jan 25 - may 25", logo: "/about/logos/philadelphia-inquirer.webp",
    blurb: "Philadelphia’s largest media outlet, with over 15 million unique monthly visitors and 180,000 active users" },
  { org: "Shmood (EF24)", role: "contract product designer", dates: "aug 24 - dec 24", logo: "/about/logos/shmood.webp",
    blurb: "Pre-seed creative tool backed by Entrepreneurs First, consolidating the feedback process between designers and their stakeholders" },
  { org: "Momentive Materials", role: "research intern", dates: "may 24 - aug 24",
    blurb: "Global maker of silicones and specialty materials" },
  { org: "Takasago", role: "flavorist intern", dates: "jun 23 - jul 23",
    blurb: "Japanese flavor and fragrance house, one of the largest in the world" },
];
const SCHOOL: CareerRow[] = [
  { org: "New York University", role: "m.s. integrated design", dates: "sep 25 - may 27",
    blurb: "Private research university in New York City" },
  { org: "Cornell University", role: "b.s. agricultural sciences", dates: "aug 23 - may 25",
    blurb: "Ivy League university in Ithaca, New York" },
  { org: "Diablo Valley College", role: "a.s. chemistry", dates: "aug 21 - may 23",
    blurb: "Community college in Pleasant Hill, California" },
];

/** one of the page's still photos; it comes into focus out of a soft blur as it scrolls in
    (data-reveal="blur", globals.css — the same entrance as the case-study figures) */
function Snap({
  className,
  src,
  alt,
  width,
  height,
  style,
}: {
  className: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`${styles.snap} ${className}`}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      data-reveal="blur"
      style={style}
    />
  );
}


export default function About() {
  const month = new Date().getMonth(); // when the page was built (refreshed daily, app/about)
  return (
    <main className={styles.page}>
      <section className={styles.hello} aria-labelledby="about-name">
        <p className={styles.intro} data-reveal="up">
          Hi there, I’m a product designer that grew up in Jakarta, Indonesia. I take life through
          the mindset to always be down to do something new. I always remind myself to thrive in any
          situation I am in and have fun while I&apos;m at it. Hope you learn more about me here :)
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
        <Snap className={styles.snapInterests} src="/about/interests.webp" alt="Looking out over a canyon of orange rock spires" width={479} height={213} style={{ "--i": 2 } as React.CSSProperties} />
        <Snap className={styles.snapSunset} src="/about/sunset.webp" alt="An orange sunset over the water" width={479} height={213} />
        <p className={styles.tip} data-reveal="up" style={{ "--i": 1 } as React.CSSProperties}>
          always remember pause and look at the sunset
        </p>
      </section>

      <section className={styles.career} aria-label="Experience and education">
        <h2 className={`${styles.careerLabel} ${styles.workLabel}`} data-reveal="up" data-reveal-early="ahead">
          Who built me professionally
        </h2>
        <span className={`${styles.careerRule} ${styles.workRule}`} aria-hidden="true" />
        <CareerRows items={WORK} className={styles.workRows} />
        <Snap className={styles.snapWork} src="/about/work.webp" alt="Matthew at his Cornell graduation, in a red stole on a wooden bridge" width={340} height={465} />
        <h2 className={`${styles.careerLabel} ${styles.schoolLabel}`} data-reveal="up" data-reveal-early="ahead">
          Where I found my footing
        </h2>
        <span className={`${styles.careerRule} ${styles.schoolRule}`} aria-hidden="true" />
        <CareerRows items={SCHOOL} className={styles.schoolRows} />
        <Snap className={styles.snapSchool} src="/about/school.webp" alt="Rows of lettuce growing under a greenhouse roof" width={513} height={281} />
      </section>

      <section className={styles.recs} aria-labelledby="produce-recs">
        <h2 id="produce-recs" className={styles.recsTitle} data-reveal="up">
          PRODUCE
          <br />
          RECS
        </h2>
        <RecsMonth initial={month} style={{ "--i": 1 } as React.CSSProperties} />
        <Snap className={styles.snapProduce} src="/about/produce.webp" alt="Heirloom and cherry tomatoes at a market stall" width={479} height={213} style={{ "--i": 2 } as React.CSSProperties} />
      </section>

      <RecsList initial={month} />
    </main>
  );
}
