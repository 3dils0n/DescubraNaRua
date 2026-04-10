import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { syncPaymentStatusFromGateway } from "@repo/payments";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;

  const p = await prisma.pixPayment.findUnique({
    where: { id },
    include: {
      reservation: {
        include: {
          raffle: true,
          participant: true,
          numbers: { include: { raffleNumber: true } },
        },
      },
    },
  });
  if (!p) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const rid = p.externalPaymentId ?? p.txid;
  const webhooks = rid
    ? await prisma.webhookInbox.findMany({
        where: { resourceId: rid },
        take: 30,
        orderBy: { createdAt: "desc" },
      })
    : [];

  return NextResponse.json({
    ...p,
    valor: Number(p.valor),
    reservation: {
      ...p.reservation,
      valorTotal: Number(p.reservation.valorTotal),
    },
    webhooks,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body?.action !== "sync") return NextResponse.json({ error: "BAD_ACTION" }, { status: 400 });
  await syncPaymentStatusFromGateway(id);
  return NextResponse.json({ ok: true });
}
