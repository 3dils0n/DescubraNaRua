import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { verifyAdminToken, COOKIE_NAME } from "./jwt";

export async function requireAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;
  const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
  return admin;
}
