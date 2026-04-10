import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { verifyPassword } from "@/lib/password";
import { signAdminToken, COOKIE_NAME } from "@/lib/jwt";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const admin = await prisma.admin.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!admin || !(await verifyPassword(body.password, admin.passwordHash))) {
    return NextResponse.json({ error: "CREDENCIAIS_INVALIDAS" }, { status: 401 });
  }

  const token = await signAdminToken({ sub: admin.id, email: admin.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
