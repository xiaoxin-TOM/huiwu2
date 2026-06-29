import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use the Edge-compatible config (no Prisma) for the middleware.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const role = req.auth?.user?.role;
  if (role !== "ADMIN") {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
