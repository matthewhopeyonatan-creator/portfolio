import type { Metadata } from "next";
import { get, list } from "@vercel/blob";
import styles from "./page.module.css";

/**
 * Matthew's receipt log: every receipt a visitor checked out (app/api/receipts), newest first,
 * with what was in their basket, their note, what they looked at longest, how long they stayed
 * and a picture of their slip — and, under Visitors, every visit whether or not they checked out
 * (app/api/visits): how long, which pages, what they looked at, what they left in the cart.
 * Behind the password in proxy.ts.
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

type Visit = {
  id: string;
  start: number;
  minutes: number;
  pages: string[];
  views: { name: string; seconds: number }[];
  cart: { name: string; qty: number }[];
  checkedOut: boolean;
  receiptId: string | null;
  referrer: string;
  updatedAt: number;
  userAgent: string;
  country: string | null;
  city: string | null;
};

/** the latest visits (most recently updated first), at most `max` of them */
async function loadVisits(max = 300): Promise<Visit[]> {
  const blobs: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "visits/", cursor, limit: 1000 });
    for (const b of page.blobs) if (b.pathname.endsWith(".json")) blobs.push(b);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
  const rows = await Promise.all(
    blobs.slice(0, max).map(async (b) => {
      try {
        const r = await get(b.pathname, { access: "private", useCache: false });
        if (!r?.stream) return null;
        return JSON.parse(await new Response(r.stream).text()) as Visit;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is Visit => !!r).sort((a, b) => b.start - a.start);
}

const PAGE_NAMES: Record<string, string> = { "/": "Home", "/about": "About", "/receipt": "Receipt" };
const pageName = (p: string) => PAGE_NAMES[p] ?? p;
const secs = (s: number) => (s < 60 ? `${s}s` : `${Math.round(s / 60)} min`);
const host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
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

export default async function ReceiptLog({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const visitorsView = (await searchParams).view === "visitors";
  if (visitorsView) return <Visitors />;

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
        <Tabs on="receipts" />
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

function Tabs({ on }: { on: "receipts" | "visitors" }) {
  return (
    <nav className={styles.tabs} aria-label="Log">
      <a href="/admin/receipts" className={on === "receipts" ? styles.tabOn : ""}>
        Receipts
      </a>
      <a href="/admin/receipts?view=visitors" className={on === "visitors" ? styles.tabOn : ""}>
        Visitors
      </a>
    </nav>
  );
}

/** every visit, checked out or not (the latest 300) */
async function Visitors() {
  let rows: Visit[] = [];
  let error = "";
  try {
    rows = await loadVisits();
  } catch (e) {
    error = e instanceof Error ? e.message : "Couldn’t read the visits.";
  }
  const checkedOut = rows.filter((r) => r.checkedOut).length;
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.minutes, 0) / rows.length) : 0;
  const leftCarts = rows.filter((r) => !r.checkedOut && r.cart.length).length;
  // what gets looked at most, across everyone
  const looked = new Map<string, number>();
  for (const r of rows) for (const v of r.views) looked.set(v.name, (looked.get(v.name) ?? 0) + 1);
  const topLooked = [...looked.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Receipt log</h1>
        <p className={styles.sub}>Every visit to hope’s grocer, checked out or not, newest first.</p>
        <Tabs on="visitors" />
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.stats} aria-label="Summary">
        <div>
          <span className={styles.statNum}>{rows.length}</span>
          <span className={styles.statLabel}>visits</span>
        </div>
        <div>
          <span className={styles.statNum}>
            {rows.length ? Math.round((checkedOut / rows.length) * 100) : 0}%
          </span>
          <span className={styles.statLabel}>checked out ({checkedOut})</span>
        </div>
        <div>
          <span className={styles.statNum}>{avg}</span>
          <span className={styles.statLabel}>avg. minutes · {leftCarts} left a full cart</span>
        </div>
        <div className={styles.top}>
          <span className={styles.statLabel}>looked at by the most people</span>
          <ol>
            {topLooked.map(([name, n]) => (
              <li key={name}>
                {name} <span>× {n}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {rows.length === 0 && !error ? (
        <p className={styles.empty}>No visits logged yet — they’ll show up here as people leave the site.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id} className={`${styles.row} ${styles.visit}`}>
              <div className={styles.info}>
                <p className={styles.meta}>
                  <b>{when(r.start)}</b>
                  {[r.city, r.country].filter(Boolean).join(", ") ? (
                    <> · {[r.city, r.country].filter(Boolean).join(", ")}</>
                  ) : null}{" "}
                  · {device(r.userAgent)}
                  {r.referrer ? <> · from {host(r.referrer)}</> : null}
                  {r.checkedOut ? <span className={styles.badge}>checked out</span> : null}
                </p>
                <dl className={styles.facts}>
                  <div>
                    <dt>Time on site</dt>
                    <dd>
                      {r.minutes} {r.minutes === 1 ? "minute" : "minutes"}
                    </dd>
                  </div>
                  <div>
                    <dt>Pages</dt>
                    <dd>{[...new Set(r.pages)].map(pageName).join(" → ") || "—"}</dd>
                  </div>
                  <div>
                    <dt>Looked at</dt>
                    <dd>
                      {r.views.length
                        ? r.views.map((v) => `${v.name} (${secs(v.seconds)})`).join(", ")
                        : "Just browsing"}
                    </dd>
                  </div>
                  {r.cart.length ? (
                    <div>
                      <dt>{r.checkedOut ? "Cart" : "Left in cart"}</dt>
                      <dd>{r.cart.map((i) => `${i.name} × ${i.qty}`).join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
