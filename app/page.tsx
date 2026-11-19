import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import ProjectCard from "@/components/ProjectCard";
import GrocersSelects from "@/components/GrocersSelects";
import SiteHeader from "@/components/SiteHeader";
import RevealOnScroll from "@/components/RevealOnScroll";
import type { Metadata } from "next";
import { projects } from "@/data/site";
import styles from "./page.module.css";

/**
 * A shared project link (/?project=slug, which opens that case study) gets its own link preview:
 * the project's tray as the picture (public/og/<slug>-v2.jpg, a still of the project preview on the homepage) and the
 * project's name. Any other link to the homepage keeps the site's own preview (layout.tsx).
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}): Promise<Metadata> {
  const slug = (await searchParams).project;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  const title = `${p.title} — hope’s grocer`;
  const image = { url: `/og/${p.slug}-v2.jpg`, width: 1200, height: 630, alt: `${p.title}: ${p.subtitle}` };
  return {
    title,
    description: p.subtitle,
    openGraph: { title, description: p.subtitle, siteName: "hope’s grocer", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description: p.subtitle, images: [image] },
  };
}

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
              Projects selected to showcase my past works in product design{" "}
              {/* phones hide the break: the space keeps "design" and "I" apart */}
              <br />
              I hope to convey care, versatility, and craft through them
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
