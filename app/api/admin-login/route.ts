import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, adminToken } from "@/lib/adminAuth";

export const runtime = "nodejs";

/** The sign-in form posts here: right password → cookie and on to the log; otherwise back with why. */
export async function POST(req: Request) {
  const form = await req.formData();
  const typed = String(form.get("password") ?? "").trim();
  const password = adminPassword();
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);

  if (!password) return to("/admin/login?e=unset");
  if (typed !== password) return to("/admin/login?e=wrong");

  const res = to("/admin/receipts");
  res.cookies.set(ADMIN_COOKIE, await adminToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
