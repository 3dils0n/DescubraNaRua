import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { ReservationStatus, RaffleNumberStatus } from "@prisma/client";
import { z } from "zod";
import { queueWhatsAppPaymentApproved } from "@repo/whatsapp";
import { syncPaymentStatusFromGateway } from "@repo/payments";

const patchSchema = z.object({
  action: z.enum(["cancel", "resync_pix", "resend_whatsapp"]),
  pixPaymentId: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;

  const r = await prisma.reservation.findUnique({
    where: { id },
    include: {
      raffle: true,
      participant: true,
      numbers: { include: { raffleNumber: true } },
      pixPayments: { orderBy: { createdAt: "desc" } },
      whatsappMsgs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const webhooks = await prisma.webhookInbox.findMany({
    where: {
      resourceId: { in: r.pixPayments.map((p) => p.externalPaymentId).filter(Boolean) as string[] },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ...r,
    valorTotal: Number(r.valorTotal),
    pixPayments: r.pixPayments.map((p) => ({
      ...p,
      valor: Number(p.valor),
    })),
    webhooks,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const body = patchSchema.parse(await req.json());

  const res = await prisma.reservation.findUnique({
    where: { id },
    include: { numbers: true },
  });
  if (!res) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (body.action === "cancel") {
    if (res.status !== ReservationStatus.PENDING) {
      return NextResponse.json({ error: "SO_PENDENTE" }, { status: 400 });
    }
    const numIds = res.numbers.map((n) => n.raffleNumberId);
    await prisma.$transaction(async (tx) => {
      await tx.reservationNumber.deleteMany({ where: { reservationId: id } });
      if (numIds.length) {
        await tx.raffleNumber.updateMany({
          where: { id: { in: numIds } },
          data: { status: RaffleNumberStatus.AVAILABLE, blockedReason: null },
        });
      }
      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
      });
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resync_pix") {
    const pixId = body.pixPaymentId ?? (await prisma.pixPayment.findFirst({ where: { reservationId: id } }))?.id;
    if (!pixId) return NextResponse.json({ error: "SEM_PIX" }, { status: 400 });
    await syncPaymentStatusFromGateway(pixId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resend_whatsapp") {
    await queueWhatsAppPaymentApproved(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "BAD_ACTION" }, { status: 400 });
}
