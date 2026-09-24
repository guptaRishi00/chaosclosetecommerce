import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

// Route groups like (dashboard) don't appear in the URL, so protection is by path.
// Add new protected prefixes here AND to `config.matcher`.
const PROTECTED_PREFIXES = ["/dashboard"];
const ADMIN_LOGIN = "/admin/login";

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

function toLogin(req: NextRequest, loginPath: string) {
  const { pathname, search } = req.nextUrl;
  const url = new URL(loginPath, req.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);

  // Admin area. The role claim here only routes; admin pages/actions re-check the DB (lib/admin.ts).
  if (under(pathname, "/admin")) {
    // Never auto-redirect away from the login page on the JWT claim alone: a demoted admin's
    // token still says "admin", and the DB-checked console would bounce them straight back
    // here — an infinite loop. The login page itself redirects only after a DB check.
    if (pathname === ADMIN_LOGIN) return NextResponse.next();
    return session?.role === "admin" ? NextResponse.next() : toLogin(req, ADMIN_LOGIN);
  }

  if (PROTECTED_PREFIXES.some((p) => under(pathname, p)) && !session) {
    const res = toLogin(req, "/login");
    if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE); // drop expired/tampered token
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
