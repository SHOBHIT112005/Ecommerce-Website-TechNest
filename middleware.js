import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const requiresAuth =
    pathname === "/checkout" ||
    pathname === "/api/checkout" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin");

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isApiRoute) {
      return jsonError("Unauthorized", 401);
    }

    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search || ""}`);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute && token.role !== "admin") {
    if (isApiRoute) {
      return jsonError("Forbidden", 403);
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout", "/admin/:path*", "/api/checkout", "/api/admin/:path*"],
};
