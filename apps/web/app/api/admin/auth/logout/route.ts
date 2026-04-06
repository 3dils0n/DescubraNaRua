import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/jwt";

export async function POST(request: Request) {
  const url = new URL("/admin/login", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
