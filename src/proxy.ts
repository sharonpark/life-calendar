import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/invite", "/api/auth"];

// Auth.js database sessions can't be verified here: the Prisma adapter uses
// the `pg` driver, which needs the Node runtime, not the Edge runtime this
// middleware runs in. So this only does an optimistic cookie-presence check
// for a fast redirect — the authoritative check (and redirect) happens in
// (dashboard)/layout.tsx via `await auth()`, which does hit the database.
export default function middleware(req: NextRequest) {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const hasSessionCookie =
    req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");

  if (!hasSessionCookie && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
