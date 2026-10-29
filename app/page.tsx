import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import ProjectCard from "@/components/ProjectCard";
import GrocersSelects from "@/components/GrocersSelects";
import PastExperiences from "@/components/PastExperiences";
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
        <section id="seasonal-picks" aria-label="Seasonal picks">
          <ul className={styles.grid}>
            {projects.map((project, i) => (
              <li key={project.slug} className={styles.cell}>
                {/* the card rises in, the right-hand one a beat after the left */}
                <div
                  data-reveal="tray"
                  // the top row peeks up from the bottom of the first screen, so it rises in
                  // as soon as any of it shows
                  data-reveal-early={i < 2 ? "" : undefined}
                  style={{ "--i": i % 2 } as React.CSSProperties}
                >
                  <ProjectCard project={project} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <GrocersSelects />
        <PastExperiences />
      </main>
      <SiteFooter />
      <RevealOnScroll />
    </>
  );
}
