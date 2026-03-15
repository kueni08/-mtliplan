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

  if (session?.role === "child") {
    const childId = session.childId;
    // Block admin-only pages
    if (pathname.startsWith("/einstellungen") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(`/kind/${childId}`, req.url));
    }
    // Prevent child from viewing other children's profiles
    if (
      pathname.startsWith("/kind/") &&
      !pathname.startsWith(`/kind/${childId}`) &&
      pathname !== "/kind/me"
    ) {
      return NextResponse.redirect(new URL(`/kind/${childId}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icons|sw\\.js|manifest\\.json|.*\\.png|.*\\.ico).*)"],
};
