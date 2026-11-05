import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminPassword, adminToken } from "@/lib/adminAuth";

/**
 * Matthew's receipt log (/admin/receipts) and its picture route are behind a password (the
 * ADMIN_PASSWORD environment variable on Vercel). Signing in at /admin/login sets a cookie; without
 * it, pages send you to the sign-in page and the picture route answers 401.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const password = adminPassword();
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (password && cookie && cookie === (await adminToken(password))) return NextResponse.next();

  if (pathname.startsWith("/api/")) return new NextResponse("Sign in first", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
