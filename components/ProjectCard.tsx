"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/site";
import { useCart } from "@/components/cart/CartContext";
import styles from "./ProjectCard.module.css";

/** Figma "… image": foam tray → project shot (or red placeholder) → plastic wrap on top. */
function WrappedTray({ cover }: { cover?: Project["cover"] }) {
  return (
    <div className={styles.tray}>
      <Image
        src="/home/tray.webp"
        alt=""
        width={1362}
        height={932}
        sizes="(max-width: 767px) 88vw, 40vw"
        className={styles.trayBase}
      />
      <div className={styles.content}>
        {cover ? (
          <Image src={cover.src} alt={cover.alt} fill sizes="(max-width: 767px) 64vw, 29vw" className={styles.coverImage} />
        ) : null}
      </div>
      <Image
        src="/home/plastic-wrap.webp"
        alt=""
        width={1348}
        height={914}
        sizes="(max-width: 767px) 88vw, 40vw"
        className={styles.wrap}
      />
    </div>
  );
}

export default function ProjectCard({ project }: { project: Project }) {
  const external = project.href.startsWith("http");
  const { add } = useCart();
  return (
    <Link
      href={project.href}
      onClick={() => add(project.slug)}
      className={styles.card}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div className={styles.media}>
        <WrappedTray cover={project.cover} />
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
