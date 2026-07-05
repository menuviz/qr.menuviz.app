import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "./lib/session";

const PUBLIC_PREFIXES = ["/login", "/r/", "/api/program", "/_next/"];
const PUBLIC_FILES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

// Stays on the deprecated `middleware` convention on purpose: Next 16's
// `proxy` runs on the Node runtime, which @opennextjs/cloudflare rejects.
export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const isPublic =
    PUBLIC_FILES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname);

  if (isPublic) {
    return NextResponse.next();
  }

  const isSignedIn = verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

  if (isSignedIn) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
