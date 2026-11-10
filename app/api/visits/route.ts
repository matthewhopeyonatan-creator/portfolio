import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * Visit summaries from the site (lib/visit.ts logVisit, sent when a visitor leaves or switches
 * away) go into Matthew's private Blob store as visits/<id>.json — one per visit, each new copy
 * replacing the last. Crawlers and link previews are skipped. Only /admin/receipts reads them.
 */
export const runtime = "nodejs";

const ID = /^[a-z0-9-]{8,64}$/i;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse/i;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

export async function POST(req: Request) {
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);
  if (BOT.test(ua)) return NextResponse.json({ ok: true });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = text(body.id, 64);
  if (!ID.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  const list = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);
  const record = {
    id,
    start: Number(body.start) || Date.now(),
    minutes: num(body.minutes, 10_000),
    pages: list(body.pages, 40).map((p) => text(p, 120)).filter(Boolean),
    views: list(body.views, 12).map((v) => ({
      name: text((v as { name?: unknown })?.name, 80),
      seconds: num((v as { seconds?: unknown })?.seconds, 1_000_000),
    })),
    cart: list(body.cart, 30).map((i) => ({
      name: text((i as { name?: unknown })?.name, 80),
      qty: num((i as { qty?: unknown })?.qty, 99),
    })),
    checkedOut: body.checkedOut === true,
    receiptId: text(body.receiptId, 64) || null,
    referrer: text(body.referrer, 200),
    updatedAt: Date.now(),
    userAgent: ua,
    country: req.headers.get("x-vercel-ip-country") ?? null,
    city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "") || null,
  };

  try {
    await put(`visits/${id}.json`, JSON.stringify(record), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
