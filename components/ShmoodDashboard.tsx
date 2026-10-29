"use client";

import styles from "./ShmoodDashboard.module.css";

/**
 * Shmood's final dashboard rebuilt in code for its case study (Figma 206:3616, "Dashboard Final").
 * A 1512 × 982 frame laid out in frame px (`--d`, from its own width) so it stays sharp at every
 * size. Static — it's the finished screen.
 */
const DIR = "/projects/shmood/dashboard";

const PROJECTS = [
  { src: "dcc", name: "DCC Branding", on: true },
  { src: "p2", name: "Shmood x DCC" },
  { src: "p3", name: "Final Showcase" },
  { src: "p4", name: "DCC Merch" },
  { src: "p5", name: "Design Fest" },
  { src: "p6", name: "Old Branding" },
];

const REVIEWS = [
  { days: 1, tone: "red", title: "DCC FA24 Recruitment" },
  { days: 2, tone: "yellow", title: "DCC Summer Spotlight" },
  { days: 4, tone: "yellow", title: "DCC Final Showcase" },
  { days: 14, tone: "grey", title: "DCC SP24 Newbie Spotlight" },
] as const;

const FILES = [
  { icon: "figma", name: "Main Design File" },
  { icon: "file", name: "Animations" },
  { icon: "file", name: "Promo Video" },
];

const BOARDS = ["b1", "b2", "b3", "b4", "b2"];

function Icon({ name, size }: { name: string; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.icon}
      src={`${DIR}/${name}.svg`}
      alt=""
      style={{ "--i": size } as React.CSSProperties}
    />
  );
}

function CardHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div className={styles.cardHead}>
      <Icon name={icon} size={24} />
      {title}
    </div>
  );
}

export default function ShmoodDashboard() {
  return (
    <div
      className={styles.screen}
      role="img"
      aria-label="Shmood's final dashboard for a DCC Branding project: project overview, files, feedback center and boards"
    >
      <div className={styles.canvas} aria-hidden="true">
        {/* top bar */}
        <div className={styles.nav}>
          <Icon name="squiggle" size={80} />
          <div className={styles.account}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.bell} src={`${DIR}/bell.svg`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.avatar} src={`${DIR}/avatar.webp`} alt="" />
          </div>
        </div>

        {/* sidebar */}
        <aside className={styles.side}>
          <div className={styles.sideTop}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.logo} src={`${DIR}/logo.svg`} alt="" />
            <div className={styles.projectsHead}>
              Projects
              <Icon name="plus18" size={18} />
            </div>
          </div>
          <ul className={styles.projects}>
            {PROJECTS.map((p) => (
              <li
                key={p.name}
                className={styles.project}
                data-on={"on" in p ? "" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${DIR}/${p.src}.webp`} alt="" />
                {p.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* main */}
        <div className={styles.main}>
          <div className={styles.title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${DIR}/dcc.webp`} alt="" />
            DCC Branding
          </div>

          <div className={styles.top}>
            <div className={styles.left}>
              <section className={`${styles.card} ${styles.overview}`}>
                <CardHead icon="rocket" title="Project Overview" />
                <div className={styles.overviewBody}>
                  <div className={styles.overviewRow}>
                    <div className={styles.field}>
                      <div className={styles.label}>Goal</div>
                      <div className={styles.goal}>
                        The goal of this project is to form a cohesive rebranding kit for DCC,
                        the Ivy League’s premier college design consultancy.
                      </div>
                    </div>
                    <div className={styles.field}>
                      <div className={`${styles.label} ${styles.labelTeam}`}>Team</div>
                      <div className={styles.team}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${DIR}/team1.webp`} alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${DIR}/team2.webp`} alt="" />
                        <span className={styles.teamAdd}>
                          <Icon name="plus18" size={18} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <div className={styles.statCap}>This week, you’ve sent out</div>
                      <div className={styles.statVal}>
                        <b>10</b>
                        <span>
                          Feedback
                          <br />
                          Forms
                        </span>
                      </div>
                    </div>
                    <div className={styles.stat}>
                      <div className={styles.statCap}>This week, you can review</div>
                      <div className={styles.statVal}>
                        <b>10</b>
                        <span>
                          Feedback
                          <br />
                          Forms
                        </span>
                      </div>
                    </div>
                    <div className={styles.stat}>
                      <div className={styles.statCap}>Overall client satisfaction</div>
                      <div className={styles.statVal}>
                        <Icon name="happy" size={38} />
                        <span>Happy Camper!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${styles.card} ${styles.files}`}>
                <div className={styles.headRow}>
                  <CardHead icon="folder-open" title="Your Files" />
                  <Icon name="plus20" size={20} />
                </div>
                <div className={styles.chips}>
                  {FILES.map((f) => (
                    <span key={f.name} className={styles.chip}>
                      <Icon name={f.icon} size={12} />
                      {f.name}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <section className={`${styles.card} ${styles.feedback}`}>
              <div className={styles.headRow}>
                <CardHead icon="radio" title="Feedback Center" />
                <span className={styles.button}>Request Feedback</span>
              </div>
              <div className={styles.reviews}>
                <div className={styles.label}>Needs review</div>
                {REVIEWS.map((r) => (
                  <div key={r.title} className={styles.review} data-tone={r.tone}>
                    <span className={styles.badge}>
                      <b>{r.days}</b>
                      DAYS
                    </span>
                    <span className={styles.reviewText}>
                      <b>{r.title}</b>
                      December 20, 2024 at 11:45AM
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.more}>View More</div>
            </section>
          </div>

          <section className={`${styles.card} ${styles.boardsCard}`}>
            <div className={styles.headRow}>
              <div className={`${styles.cardHead} ${styles.cardHeadLight}`}>
                <Icon name="files" size={24} />
                Your Boards
              </div>
              <Icon name="plus20" size={20} />
            </div>
            <div className={styles.boards}>
              {BOARDS.map((b, i) => (
                <div key={i} className={styles.board}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.boardArt} src={`${DIR}/${b}.webp`} alt="" />
                  <div className={styles.boardCard}>
                    <div className={styles.boardKind}>BOARD</div>
                    <div className={styles.boardName}>Andromeda.computer</div>
                    <div className={styles.boardTools}>
                      <Icon name="pencil" size={20} />
                      <Icon name="trash" size={20} />
                      <Icon name="share" size={20} />
                      <span>04/19/24</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
