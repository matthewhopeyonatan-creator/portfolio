"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/site";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import ProjectOverlay from "@/components/ProjectOverlay";
import styles from "./ProjectCard.module.css";

/** Figma "… image": foam tray → project shot (or red placeholder) → plastic wrap on top. */
function WrappedTray({
  cover,
  video,
  badge,
  shot,
  shotArt,
  soldOut,
}: {
  cover?: Project["cover"];
  video?: string;
  badge?: string;
  shot?: string;
  shotArt?: Project["shotArt"];
  soldOut?: boolean;
}) {
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
        <div
          className={styles.content}
          style={shot ? { background: shot } : undefined}
        >
          {video ? (
            <video
              className={styles.coverVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source
                src={video.replace(/\.mp4$/, ".webm")}
                type="video/webm"
              />
              <source src={video} type="video/mp4" />
            </video>
          ) : cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(max-width: 767px) 64vw, 29vw"
              className={styles.coverImage}
            />
          ) : null}
          {shotArt?.map((art) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={art.src}
              src={art.src}
              alt=""
              draggable={false}
              className={styles.shotArt}
              style={{
                left: `${(art.left / 487.111) * 100}%`,
                top: `${(art.top / 274) * 100}%`,
                width: `${(art.width / 487.111) * 100}%`,
              }}
            />
          ))}
        </div>
        {/* the logo: its own item in the tray, lying across the shot's corner, under the wrap */}
        {badge ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge} alt="" className={styles.badge} draggable={false} />
        ) : null}
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
      {/* Figma 78:2301: a price-gun style banner stuck across the pack, over the wrap */}
      {soldOut ? (
        <div className={styles.soldOut}>
          <span className={styles.soldOutBig} aria-hidden="true">
            Sold out sold
          </span>
          <span className={styles.soldOutSmall} aria-hidden="true">
            on sale soon on sale soon on sale soon on sale soon
          </span>
          <span className={styles.srOnly}>
            Sold out, case study on sale soon
          </span>
        </div>
      ) : null}
      {/* the only hover / click zone: the foam tray's own rounded shape */}
      <span className={styles.trayHit} aria-hidden="true" />
    </div>
  );
}

export default function ProjectCard({ project }: { project: Project }) {
  const external = project.href.startsWith("http");
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  // a refresh on a project page (?project=slug) lands back on that project, full screen
  const [fromUrl, setFromUrl] = useState(false);
  useEffect(() => {
    if (project.soldOut) return;
    if (new URLSearchParams(window.location.search).get("project") === project.slug) {
      setFromUrl(true);
      setOpen(true);
    }
  }, [project.slug, project.soldOut]);
  const body = (
    <>
      <div className={styles.media}>
        <WrappedTray
          cover={project.cover}
          video={project.video}
          badge={project.badge}
          shot={project.shot}
          shotArt={project.shotArt}
          soldOut={project.soldOut}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.heading}>
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.subtitle}>{project.subtitle}</p>
        </div>
        <ul className={styles.tags} aria-label="Tags">
          {/* in pairs: on phones each pair is its own row (Figma 231:1707); elsewhere the pairs
              dissolve into one wrapping row */}
          {project.tags
            .reduce<string[][]>((rows, tag, i) => {
              if (i % 2 === 0) rows.push([tag]);
              else rows[rows.length - 1].push(tag);
              return rows;
            }, [])
            .map((pair) => (
              <li key={pair[0]} className={styles.tagPair}>
                {pair.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </li>
            ))}
        </ul>
      </div>
    </>
  );

  // coming soon (sold out): shown, but not a link — no popup, nothing added to the cart
  if (project.soldOut) {
    return (
      <div className={`${styles.card} ${styles.static}`} aria-disabled="true">
        {body}
      </div>
    );
  }

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
        {body}
      </Link>
      {open && (
        <ProjectOverlay
          project={project}
          fromUrl={fromUrl}
          onClose={() => {
            setOpen(false);
            setFromUrl(false);
          }}
        />
      )}
    </>
  );
}
