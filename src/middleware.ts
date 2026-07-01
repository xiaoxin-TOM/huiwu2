import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";

// Use the Edge-compatible config (no Prisma) for the middleware.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const role = req.auth?.user?.role as string | undefined;
  if (!isAdmin(role)) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
