import { get } from "@vercel/blob";

/** A receipt's pictures for /admin/receipts — the order side, or with ?side=back the photobooth
 *  side (the store is private; proxy.ts asks for the password). */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const back = url.searchParams.get("side") === "back";
  if (!/^[a-z0-9-]{8,64}$/i.test(id)) return new Response("Not found", { status: 404 });
  try {
    const r = await get(back ? `receipts/${id}-back.jpg` : `receipts/${id}.png`, { access: "private" });
    if (!r || !r.stream) return new Response("Not found", { status: 404 });
    return new Response(r.stream, {
      headers: { "content-type": back ? "image/jpeg" : "image/png", "cache-control": "private, max-age=60" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
