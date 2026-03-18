import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Not logged in and not on login page → redirect to login
  if (!session && pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Pending users can only access the pending page and auth endpoints
  if (session?.role === "pending" && pathname !== "/pending") {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  // Child role: restrict to their own profile page
  if (session?.role === "child") {
    const memberId = session.memberId;
    if (pathname.startsWith("/einstellungen") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(`/kind/${memberId}`, req.url));
    }
    if (
      pathname.startsWith("/kind/") &&
      !pathname.startsWith(`/kind/${memberId}`) &&
      pathname !== "/kind/me"
    ) {
      return NextResponse.redirect(new URL(`/kind/${memberId}`, req.url));
    }
  }

  // Adult role: access to dashboard + kind pages, but not einstellungen
  if (session?.role === "adult") {
    if (pathname.startsWith("/einstellungen")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icons|sw\\.js|manifest\\.json|.*\\.png|.*\\.ico).*)"],
};
