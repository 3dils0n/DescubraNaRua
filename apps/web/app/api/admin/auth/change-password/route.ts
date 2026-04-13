import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/admin-api";
import { hashPassword, verifyPassword } from "@/lib/password";

const schema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const raw = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      flat.fieldErrors.currentPassword?.[0] ??
      flat.fieldErrors.newPassword?.[0] ??
      "Dados inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const body = parsed.data;

  if (body.newPassword === body.currentPassword) {
    return NextResponse.json({ error: "SENHA_IGUAL" }, { status: 400 });
  }

  const ok = await verifyPassword(body.currentPassword, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "SENHA_ATUAL_INVALIDA" }, { status: 401 });
  }

  const passwordHash = await hashPassword(body.newPassword);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
