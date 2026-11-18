import styles from "./InquirerProcess.module.css";

/**
 * The Inquirer case study's Iterations frames (Figma 316:3027), each in a box with the team's
 * pushback under it as a short paragraph:
 *  - MidFi (318:3380): the two greyscale mid-fi screens, rebuilt in code so they stay sharp.
 *  - FinalIsh (319:4006): the full-bleed story screen, its photo cropped from a horizontal shot.
 * Sized in --pu (1 Figma px in the popup).
 */

const ART = "/projects/inquirer/process";

/** why the team didn't take it forward, as a paragraph under the box */
const Why = ({ text }: { text: string }) => <p className={styles.why}>{text}</p>;

/** the story-progress dashes across the top of both mid-fi screens */
const Progress = () => (
  <div className={styles.progress} aria-hidden="true">
    {[50, 24, 24, 23, 24, 24].map((w, i) => (
      <span
        key={i}
        style={{ width: `calc(${w} * var(--pu))` }}
        className={i === 0 ? styles.on : ""}
      />
    ))}
  </div>
);

const Chrome = ({ dotsLeft }: { dotsLeft: number }) => (
  <>
    <Progress />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={styles.arrow} src={`${ART}/arrow-left.svg`} alt="" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      className={styles.dots}
      src={`${ART}/dots.svg`}
      alt=""
      style={{ left: `calc(${dotsLeft} * var(--pu))` }}
    />
  </>
);

export function MidFi({ why }: { why: string }) {
  return (
    <div className={styles.process}>
      <div className={styles.frame}>
        <div
          className={`${styles.row} ${styles.fitMid}`}
          role="img"
          aria-label="Two greyscale mid-fi screens: 'this is philly today', a stack of story cards swiped up with a daily button; and 'this is philly for you', a full-screen story with a 5:00 listen label"
        >
          {/* daily round up, swiping up (318:3606) */}
          <div className={styles.screen}>
            <span className={`${styles.card} ${styles.cardTilt}`} />
            <span className={`${styles.card} ${styles.cardFront}`} />
            <p className={styles.tiltText}>
              Lorem ipsum dolor
            <br />
            sit amet consectetur
            </p>
            <p className={styles.today}>
              this is
              <br />
              philly today
            </p>
            <p className={styles.cardText}>
              Lorem ipsum dolor sit amet adipiscing
            </p>
            <span className={styles.daily}>daily</span>
            <Chrome dotsLeft={351} />
          </div>
          {/* daily round up (318:3637) */}
          <div className={styles.screen}>
            <p className={styles.forYou}>
              <span>this is</span>
              <br />
              <b>philly for you</b>
            </p>
            <p className={styles.listen}>5:00 listen</p>
            <p className={styles.headline}>
              Altercation on SEPTA bus leads to deadly shooting in West
              Philadelphia: Officials
            </p>
            <Chrome dotsLeft={373} />
          </div>
        </div>
      </div>
      <Why text={why} />
    </div>
  );
}

export function FinalIsh({ why }: { why: string }) {
  return (
    <div className={styles.process}>
      <div className={styles.frame}>
        <div className={`${styles.row} ${styles.fitStory}`}>
          <div className={styles.story}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.storyShot}
              src={`${ART}/finalish-2x.webp`}
              alt="Philly For You story screen: a full-height photo cropped from a horizontal shot, with the headline, writer and save / share at the bottom"
              width={1124}
              height={2164}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
      <Why text={why} />
    </div>
  );
}
