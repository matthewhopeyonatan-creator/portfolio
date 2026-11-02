/**
 * What the receipt knows about a visit: when it started, and how long each thing was looked at
 * (a project's case study or a sticker's story). Kept in sessionStorage, so it
 * belongs to this tab and survives refreshes.
 */
const START = "hopes-grocer-visit-start";
const VIEWS = "hopes-grocer-views";
export const RECEIPT = "hopes-grocer-receipt";

export type Receipt = {
  /** this receipt's id in Matthew's receipt log (/admin/receipts) */
  id?: string;
  items: { name: string; qty: number }[];
  minutes: number;
  mostViewed: string | null;
  /** what they typed in the receipt's Notes */
  note?: string;
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

/** something (named as it should read on the receipt) was looked at for `ms` */
export function addView(name: string, ms: number) {
  if (ms < 500) return; // a mis-click isn't a view
  const views = read<Record<string, number>>(VIEWS, {});
  views[name] = (views[name] ?? 0) + ms;
  write(VIEWS, views);
}

/** total time on the site, from the first page opened in this tab until now */
export function visitMinutes() {
  const start = read<number>(START, Date.now());
  return Math.max(1, Math.round((Date.now() - start) / 60000));
}

/** whatever was looked at longest, if anything */
export function mostViewed(): string | null {
  const views = read<Record<string, number>>(VIEWS, {});
  let best: string | null = null;
  for (const [name, ms] of Object.entries(views)) if (!best || ms > views[best]) best = name;
  return best;
}

export function saveReceipt(r: Receipt) {
  write(RECEIPT, r);
}

export function loadReceipt(): Receipt | null {
  return read<Receipt | null>(RECEIPT, null);
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** gives a receipt its id in the log (once) */
export function withId(r: Receipt): Receipt {
  return r.id ? r : { ...r, id: newId() };
}

/**
 * Sends a copy of a checked-out receipt to Matthew's receipt log (/admin/receipts): what was in
 * the basket, the note, most viewed, time on site — and, when given, a picture of the slip as it
 * looks (with any drawing on it). Best effort: if it fails, the visitor never notices.
 */
export function logReceipt(r: Receipt, image?: string, beacon = false) {
  if (!r.id || !r.items.length) return;
  const body = JSON.stringify({ ...r, image });
  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/receipts", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("/api/receipts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: body.length < 60000,
    }).catch(() => {});
  } catch {}
}
