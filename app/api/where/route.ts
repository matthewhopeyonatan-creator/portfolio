import { NextResponse } from "next/server";

/**
 * The visitor's rough city, from Vercel's IP geolocation header — printed on the back of the
 * receipt. No header (local, or a lookup Vercel couldn't make) → null, and the slip says NYC.
 */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const raw = req.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  try {
    city = raw ? decodeURIComponent(raw) : null;
  } catch {
    city = raw;
  }
  return NextResponse.json({ city }, { headers: { "Cache-Control": "no-store" } });
}
