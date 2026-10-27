/**
 * What the receipt knows about a visit: when it started, and how long each project's case study
 * was open. Kept in sessionStorage, so it belongs to this tab and survives refreshes.
 */
const START = "hopes-grocer-visit-start";
const VIEWS = "hopes-grocer-project-views";
export const RECEIPT = "hopes-grocer-receipt";

export type Receipt = {
  items: { name: string; qty: number }[];
  minutes: number;
  mostViewed: string | null;
  at: number;
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = window.sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(v));
  } catch {}
};

/** call once on load: the visit starts the first time any page of the site is opened in this tab */
export function startVisit() {
  if (read<number | null>(START, null) == null) write(START, Date.now());
}

/** a case study was open for `ms` */
export function addProjectView(slug: string, ms: number) {
  if (ms < 500) return; // a mis-click isn't a view
  const views = read<Record<string, number>>(VIEWS, {});
  views[slug] = (views[slug] ?? 0) + ms;
  write(VIEWS, views);
}

export function visitMinutes() {
  const start = read<number>(START, Date.now());
  return Math.max(1, Math.round((Date.now() - start) / 60000));
}

/** slug of the project whose case study was open longest, if any */
export function mostViewedSlug(): string | null {
  const views = read<Record<string, number>>(VIEWS, {});
  let best: string | null = null;
  for (const [slug, ms] of Object.entries(views)) if (!best || ms > views[best]) best = slug;
  return best;
}

export function saveReceipt(r: Receipt) {
  write(RECEIPT, r);
}

export function loadReceipt(): Receipt | null {
  return read<Receipt | null>(RECEIPT, null);
}
