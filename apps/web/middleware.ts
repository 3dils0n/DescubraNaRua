import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_PREFIX = "/admin";
const LOGIN = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();
  if (pathname === LOGIN || pathname.startsWith(`${LOGIN}/`)) return NextResponse.next();

  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.redirect(new URL(LOGIN, req.url));
  }

  const token = req.cookies.get("admin_session")?.value;
  if (!token) return NextResponse.redirect(new URL(LOGIN, req.url));

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(LOGIN, req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
