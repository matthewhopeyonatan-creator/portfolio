"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/site";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import ProjectOverlay from "@/components/ProjectOverlay";
import styles from "./ProjectCard.module.css";

/** Figma "… image": foam tray → project shot (or red placeholder) → plastic wrap on top. */
function WrappedTray({ cover }: { cover?: Project["cover"] }) {
  return (
    <div className={styles.tray}>
      {/* foam tray + shot: grow a touch on hover */}
      <div className={styles.goods}>
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
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(max-width: 767px) 64vw, 29vw"
              className={styles.coverImage}
            />
          ) : null}
        </div>
      </div>
      {/* plastic wrap: on hover it peels back from the lower-right corner, folding over itself */}
      <div className={styles.wrap} aria-hidden="true">
        <Image
          src="/home/plastic-wrap.webp"
          alt=""
          width={1348}
          height={914}
          sizes="(max-width: 767px) 88vw, 40vw"
          className={styles.wrapFace}
        />
        <span className={styles.wrapFold}>
          <Image
            src="/home/plastic-wrap.webp"
            alt=""
            width={1348}
            height={914}
            sizes="(max-width: 767px) 88vw, 40vw"
            className={styles.wrapFlap}
          />
        </span>
      </div>
    </div>
  );
}

export default function ProjectCard({ project }: { project: Project }) {
  const external = project.href.startsWith("http");
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Link
        href={project.href}
        onClick={(e) => {
          add(project.slug);
          // a plain click opens the project popup; cmd/ctrl-click still opens the page itself
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          setOpen(true);
        }}
        aria-haspopup="dialog"
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
      {open && (
        <ProjectOverlay project={project} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
