import { get } from "@vercel/blob";

/** A receipt's picture for /admin/receipts (the store is private; proxy.ts asks for the password). */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[a-z0-9-]{8,64}$/i.test(id)) return new Response("Not found", { status: 404 });
  try {
    const r = await get(`receipts/${id}.png`, { access: "private" });
    if (!r || !r.stream) return new Response("Not found", { status: 404 });
    return new Response(r.stream, {
      headers: { "content-type": "image/png", "cache-control": "private, max-age=60" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
