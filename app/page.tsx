import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import ProjectCard from "@/components/ProjectCard";
import GrocersSelects from "@/components/GrocersSelects";
import SiteHeader from "@/components/SiteHeader";
import RevealOnScroll from "@/components/RevealOnScroll";
import { projects } from "@/data/site";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <SiteHeader intro />
      <main>
        <Hero />
        <section id="seasonal-picks" aria-labelledby="seasonal-picks-title">
          {/* Figma 210:4738 (title) + 495:4900 (subtext) */}
          <div className={`${styles.sectionTitleRow} ${styles.titleStack}`}>
            <h2
              id="seasonal-picks-title"
              className={`${styles.sectionTitle} ${styles.titleSmall}`}
              data-reveal="up"
            >
              Seasonal picks
            </h2>
            <p className={styles.titleSub} data-reveal="up" style={{ "--i": 1 } as React.CSSProperties}>
              Projects selected to showcase my past works in product design
              <br />
              Hope to convey care, versatility, and craft through them
            </p>
          </div>
          <ul className={styles.grid}>
            {projects.map((project, i) => (
              <li key={project.slug} className={styles.cell}>
                {/* the card rises in, the right-hand one a beat after the left */}
                <div
                  data-reveal="tray"
                  style={{ "--i": i % 2 } as React.CSSProperties}
                >
                  <ProjectCard project={project} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <GrocersSelects />
      </main>
      <SiteFooter />
      <RevealOnScroll />
    </>
  );
}
