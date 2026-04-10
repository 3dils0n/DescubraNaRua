import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { WhatsAppSendStatus } from "@prisma/client";
import { processPendingWhatsAppBatch } from "@repo/whatsapp";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const m = await prisma.whatsAppMessage.findUnique({
    where: { id },
    include: {
      reservation: { include: { raffle: true, participant: true } },
      participant: true,
    },
  });
  if (!m) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(m);
}

export async function POST(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  if (action === "retry") {
    await prisma.whatsAppMessage.update({
      where: { id },
      data: {
        statusEnvio: WhatsAppSendStatus.PENDING,
        nextRetryAt: null,
        erro: null,
      },
    });
    await processPendingWhatsAppBatch(5);
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_skipped") {
    await prisma.whatsAppMessage.update({
      where: { id },
      data: {
        statusEnvio: WhatsAppSendStatus.SKIPPED,
        erro: "Ignorado manualmente (admin)",
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "BAD_ACTION" }, { status: 400 });
}
