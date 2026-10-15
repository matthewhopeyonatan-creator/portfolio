import Link from "next/link";
import { cartLink, navLinks } from "@/data/site";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main">
        {navLinks.map((link) => (
          <Link key={link.label} href={link.href} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className={styles.logo} aria-label="hope's grocer — home">
        <span className={styles.logoBold}>hope</span>
        <span className={styles.logoApostrophe}>’</span>
        <span className={styles.logoBold}>s grocer</span>
      </Link>

      <a href={cartLink.href} className={styles.cart} aria-label={cartLink.ariaLabel}>
        <span className={styles.navLink}>{cartLink.label}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/cart.png" alt="" width={57} height={37} className={styles.cartIcon} />
      </a>
    </header>
  );
}
