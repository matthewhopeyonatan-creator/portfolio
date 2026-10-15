import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/site";
import styles from "./ProjectCard.module.css";

export default function ProjectCard({ project }: { project: Project }) {
  const external = project.href.startsWith("http");
  return (
    <Link
      href={project.href}
      className={styles.card}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div className={styles.media}>
        <Image
          src={project.image.src}
          alt={project.image.alt}
          width={project.image.width}
          height={project.image.height}
          sizes="(max-width: 767px) 90vw, 40vw"
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.heading}>
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.subtitle}>{project.subtitle}</p>
        </div>
        <ul className={styles.tags} aria-label="Tags">
          {project.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
