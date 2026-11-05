import { NextResponse, type NextRequest } from "next/server";

/**
 * Matthew's receipt log (/admin/receipts) and its picture route are behind a password: the
 * browser asks once (any username; the password is the ADMIN_PASSWORD environment variable on
 * Vercel). Without that variable set, the log stays shut.
 */
export function proxy(req: NextRequest) {
  // trimmed: a space or line break pasted into Vercel along with it shouldn't lock him out
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    return new NextResponse("The receipt log isn't set up yet: add ADMIN_PASSWORD on Vercel.", {
      status: 503,
    });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const raw = atob(auth.slice(6));
      const pass = raw.slice(raw.indexOf(":") + 1);
      if (pass.trim() === password) return NextResponse.next();
    } catch {}
  }
  return new NextResponse("Password needed", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="hopes grocer receipts", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
