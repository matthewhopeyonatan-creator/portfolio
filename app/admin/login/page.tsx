import type { Metadata } from "next";
import styles from "../receipts/page.module.css";

export const metadata: Metadata = {
  title: "Sign in — hope’s grocer",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  wrong: "That password doesn’t match the one saved in Vercel.",
  unset: "No password is set yet: add ADMIN_PASSWORD in Vercel, then redeploy.",
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Receipt log</h1>
        <p className={styles.sub}>Sign in to see the receipts.</p>
      </header>
      <form method="post" action="/api/admin-login" className={styles.login}>
        <label htmlFor="pw" className={styles.statLabel}>
          Password
        </label>
        <input
          id="pw"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Sign in
        </button>
        {e && MESSAGES[e] ? <p className={styles.error}>{MESSAGES[e]}</p> : null}
      </form>
    </main>
  );
}
