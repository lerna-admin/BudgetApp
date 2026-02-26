import { NextResponse } from "next/server";

const COOKIE_NAME = "budgetapp_session";

export function middleware(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const protectedRoute =
    pathname === "/" ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/gastos") ||
    pathname.startsWith("/herramientas");
  if (protectedRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/profile/:path*", "/gastos/:path*", "/herramientas/:path*"],
};
