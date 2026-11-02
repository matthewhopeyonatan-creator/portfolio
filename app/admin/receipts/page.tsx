import type { Metadata } from "next";
import { get, list } from "@vercel/blob";
import styles from "./page.module.css";

/**
 * Matthew's receipt log: every receipt a visitor checked out (app/api/receipts), newest first,
 * with what was in their basket, their note, what they looked at longest, how long they stayed
 * and a picture of their slip. Behind the password in proxy.ts.
 */
export const metadata: Metadata = {
  title: "Receipt log — hope’s grocer",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Logged = {
  id: string;
  items: { name: string; qty: number }[];
  note: string;
  mostViewed: string | null;
  minutes: number;
  at: number;
  updatedAt: number;
  userAgent: string;
  country: string | null;
  city: string | null;
  hasImage: boolean;
};

async function load(): Promise<Logged[]> {
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "receipts/", cursor, limit: 1000 });
    for (const b of page.blobs) if (b.pathname.endsWith(".json")) paths.push(b.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const rows = await Promise.all(
    paths.map(async (p) => {
      try {
        const r = await get(p, { access: "private", useCache: false });
        if (!r?.stream) return null;
        return JSON.parse(await new Response(r.stream).text()) as Logged;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is Logged => !!r).sort((a, b) => b.at - a.at);
}

const when = (t: number) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(t);

const device = (ua: string) =>
  /iphone|ipad/i.test(ua)
    ? "iPhone / iPad"
    : /android/i.test(ua)
      ? "Android"
      : /mac os/i.test(ua)
        ? "Mac"
        : /windows/i.test(ua)
          ? "Windows"
          : "Other";

export default async function ReceiptLog() {
  let rows: Logged[] = [];
  let error = "";
  try {
    rows = await load();
  } catch (e) {
    error = e instanceof Error ? e.message : "Couldn’t read the receipts.";
  }

  // what's been bought most, and the average stay
  const tally = new Map<string, number>();
  for (const r of rows) for (const i of r.items) tally.set(i.name, (tally.get(i.name) ?? 0) + i.qty);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.minutes, 0) / rows.length) : 0;
  const withNotes = rows.filter((r) => r.note.trim()).length;

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Receipt log</h1>
        <p className={styles.sub}>Every checkout on hope’s grocer, newest first.</p>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.stats} aria-label="Summary">
        <div>
          <span className={styles.statNum}>{rows.length}</span>
          <span className={styles.statLabel}>receipts</span>
        </div>
        <div>
          <span className={styles.statNum}>{avg}</span>
          <span className={styles.statLabel}>avg. minutes on the site</span>
        </div>
        <div>
          <span className={styles.statNum}>{withNotes}</span>
          <span className={styles.statLabel}>left a note</span>
        </div>
        <div className={styles.top}>
          <span className={styles.statLabel}>most in baskets</span>
          <ol>
            {top.map(([name, n]) => (
              <li key={name}>
                {name} <span>× {n}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {rows.length === 0 && !error ? (
        <p className={styles.empty}>No receipts yet — they’ll show up here as people check out.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id} className={styles.row}>
              {r.hasImage ? (
                <a
                  className={styles.shot}
                  href={`/api/admin/receipt-image?id=${r.id}&v=${r.updatedAt}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/receipt-image?id=${r.id}&v=${r.updatedAt}`}
                    alt="The visitor’s receipt slip"
                    loading="lazy"
                  />
                </a>
              ) : (
                <div className={`${styles.shot} ${styles.noShot}`}>no picture</div>
              )}
              <div className={styles.info}>
                <p className={styles.meta}>
                  <b>{when(r.at)}</b>
                  {[r.city, r.country].filter(Boolean).join(", ") ? (
                    <> · {[r.city, r.country].filter(Boolean).join(", ")}</>
                  ) : null}{" "}
                  · {device(r.userAgent)}
                </p>
                <ul className={styles.items}>
                  {r.items.map((i) => (
                    <li key={i.name}>
                      {i.name} <span>× {i.qty}</span>
                    </li>
                  ))}
                </ul>
                <dl className={styles.facts}>
                  <div>
                    <dt>Most viewed</dt>
                    <dd>{r.mostViewed ?? "Just browsing"}</dd>
                  </div>
                  <div>
                    <dt>Time on site</dt>
                    <dd>
                      {r.minutes} {r.minutes === 1 ? "minute" : "minutes"}
                    </dd>
                  </div>
                </dl>
                {r.note.trim() ? <blockquote className={styles.note}>“{r.note}”</blockquote> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
