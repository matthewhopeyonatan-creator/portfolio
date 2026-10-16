import Link from "next/link";
import { navLinks, socialLinks } from "@/data/site";
import styles from "./SiteFooter.module.css";

const SIGN = "hope’s grocer";

/** Figma "Frame 35": red band, a scrolling LED-style "HOPE'S GROCER" sign, nav + socials. */
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      {/* the sign: two identical runs side by side, slid left by one run's width, forever */}
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {[0, 1].map((run) => (
            <span key={run} className={styles.run}>
              <span className={styles.word}>{SIGN}</span>
              <span className={styles.word}>{SIGN}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="visually-hidden">hope’s grocer — Matthew Hope</p>

      <div className={styles.bottom}>
        <nav className={styles.nav} aria-label="Footer">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <ul className={styles.socials}>
          {socialLinks.map((s) =>
            s.href ? (
              <li key={s.label}>
                <a
                  href={s.href}
                  className={styles.social}
                  {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {s.label}
                </a>
              </li>
            ) : (
              <li key={s.label}>
                <span className={styles.social} aria-disabled="true">
                  {s.label}
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    </footer>
  );
}
