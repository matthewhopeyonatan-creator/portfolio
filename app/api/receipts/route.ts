import { head, put } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * Receipts sent from the receipt page (lib/visit.ts logReceipt) go into Matthew's private Blob
 * store: receipts/<id>.json (what was in the basket, the note, most viewed, time on site) and,
 * when sent, receipts/<id>.png (a picture of the order side of the slip, drawing and all) and
 * receipts/<id>-back.jpg (the photobooth side, photo and all). Each new copy of a receipt replaces
 * the last; a copy sent without pictures (the one sent as the visitor leaves) keeps the ones
 * already stored. Only /admin/receipts reads them back.
 */
export const runtime = "nodejs";

const ID = /^[a-z0-9-]{8,64}$/i;
const MAX_IMAGE = 2_500_000; // characters of base64 (about 1.8MB of PNG)

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = text(body.id, 64);
  if (!ID.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  const items = Array.isArray(body.items)
    ? body.items.slice(0, 30).map((i) => ({
        name: text((i as { name?: unknown })?.name, 80),
        qty: Math.max(0, Math.min(99, Math.round(Number((i as { qty?: unknown })?.qty) || 0))),
      }))
    : [];
  if (!items.length) return NextResponse.json({ ok: false }, { status: 400 });

  const record = {
    id,
    items,
    note: text(body.note, 280),
    mostViewed: text(body.mostViewed, 80) || null,
    minutes: Math.max(0, Math.min(10_000, Math.round(Number(body.minutes) || 0))),
    at: Number(body.at) || Date.now(),
    updatedAt: Date.now(),
    userAgent: (req.headers.get("user-agent") ?? "").slice(0, 200),
    country: req.headers.get("x-vercel-ip-country") ?? null,
    city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "") || null,
    hasImage: false,
    hasBack: false,
  };

  const image = typeof body.image === "string" ? body.image : "";
  const png = image.startsWith("data:image/png;base64,") && image.length < MAX_IMAGE;
  const back = typeof body.back === "string" ? body.back : "";
  const jpg = back.startsWith("data:image/jpeg;base64,") && back.length < MAX_IMAGE;
  const exists = async (path: string) => {
    try {
      await head(path);
      return true;
    } catch {
      return false;
    }
  };
  try {
    if (png) {
      await put(`receipts/${id}.png`, Buffer.from(image.slice(22), "base64"), {
        access: "private",
        contentType: "image/png",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      record.hasImage = true;
    } else record.hasImage = await exists(`receipts/${id}.png`);
    if (jpg) {
      await put(`receipts/${id}-back.jpg`, Buffer.from(back.slice(23), "base64"), {
        access: "private",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      record.hasBack = true;
    } else record.hasBack = await exists(`receipts/${id}-back.jpg`);
    await put(`receipts/${id}.json`, JSON.stringify(record), {
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
