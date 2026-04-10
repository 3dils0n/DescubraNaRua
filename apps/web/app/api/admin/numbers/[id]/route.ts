import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { RaffleNumberStatus } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["block", "unblock"]),
  blockedReason: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const body = patchSchema.parse(await req.json());

  const num = await prisma.raffleNumber.findUnique({ where: { id } });
  if (!num) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (body.action === "block") {
    if (num.status === RaffleNumberStatus.PAID) {
      return NextResponse.json({ error: "NUMERO_PAGO" }, { status: 400 });
    }
    if (num.status === RaffleNumberStatus.RESERVED) {
      return NextResponse.json({ error: "LIBERE_RESERVA_PRIMEIRO" }, { status: 400 });
    }
    await prisma.raffleNumber.update({
      where: { id },
      data: { status: RaffleNumberStatus.BLOCKED, blockedReason: body.blockedReason ?? "Bloqueio manual" },
    });
  } else {
    if (num.status !== RaffleNumberStatus.BLOCKED) {
      return NextResponse.json({ error: "NAO_ESTA_BLOQUEADO" }, { status: 400 });
    }
    await prisma.raffleNumber.update({
      where: { id },
      data: { status: RaffleNumberStatus.AVAILABLE, blockedReason: null },
    });
  }

  return NextResponse.json({ ok: true });
}
