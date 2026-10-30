import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageThemeToggle } from "@/components/ThemeToggle";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Not found — hope’s grocer",
  robots: { index: false },
};

/** A wrong address: the site's own page (navbar, footer, theme) instead of the framework's bare one. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <PageThemeToggle />
      <main className={styles.page}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>This aisle doesn’t exist</h1>
        <Link href="/" className={styles.link}>
          back to the store
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
