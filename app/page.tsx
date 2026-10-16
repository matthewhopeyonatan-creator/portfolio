import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import ProjectCard from "@/components/ProjectCard";
import SiteHeader from "@/components/SiteHeader";
import { projects } from "@/data/site";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <SiteHeader intro />
      <main>
        <Hero />
        <section id="seasonal-picks" aria-labelledby="seasonal-picks-title">
          <div className={styles.sectionTitleRow}>
            <h2 id="seasonal-picks-title" className={styles.sectionTitle}>
              Seasonal picks
            </h2>
          </div>
          <ul className={styles.grid}>
            {projects.map((project) => (
              <li key={project.slug} className={styles.cell}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </section>
        <div className={styles.footerSpace} />
      </main>
      <SiteFooter />
    </>
  );
}
