import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import {
  PixInternalStatus,
  RaffleStatus,
  ReservationStatus,
  WebhookInboxStatus,
  WhatsAppSendStatus,
} from "@prisma/client";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    totalRaffles,
    activeRaffles,
    paidNumbers,
    pendingRes,
    paidToday,
    expiredPix,
    failedWa,
    pendingWa,
    revenue,
    webhooksPending,
    webhooksFailed,
    failedPix,
    recentReservations,
    recentPayments,
    failedWebhooksList,
    failedWaList,
    paidLast14,
  ] = await Promise.all([
    prisma.raffle.count(),
    prisma.raffle.count({ where: { status: RaffleStatus.ACTIVE } }),
    prisma.raffleNumber.count({ where: { status: "PAID" } }),
    prisma.reservation.count({ where: { status: ReservationStatus.PENDING } }),
    prisma.reservation.count({
      where: { status: ReservationStatus.PAID, paidAt: { gte: today } },
    }),
    prisma.pixPayment.count({ where: { statusInterno: PixInternalStatus.EXPIRED } }),
    prisma.whatsAppMessage.count({ where: { statusEnvio: WhatsAppSendStatus.FAILED } }),
    prisma.whatsAppMessage.count({ where: { statusEnvio: WhatsAppSendStatus.PENDING } }),
    prisma.reservation.aggregate({
      where: { status: ReservationStatus.PAID },
      _sum: { valorTotal: true },
    }),
    prisma.webhookInbox.count({
      where: { status: WebhookInboxStatus.PENDING },
    }),
    prisma.webhookInbox.count({
      where: { status: WebhookInboxStatus.FAILED },
    }),
    prisma.pixPayment.count({
      where: { statusInterno: PixInternalStatus.FAILED },
    }),
    prisma.reservation.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        raffle: { select: { titulo: true, slug: true } },
        participant: { select: { nome: true, telefone: true } },
      },
    }),
    prisma.pixPayment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      where: { statusInterno: PixInternalStatus.APPROVED },
      include: {
        reservation: {
          select: { codigo: true, raffle: { select: { titulo: true } } },
        },
      },
    }),
    prisma.webhookInbox.findMany({
      take: 6,
      where: { status: WebhookInboxStatus.FAILED },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        topic: true,
        resourceId: true,
        lastError: true,
        attempts: true,
        createdAt: true,
      },
    }),
    prisma.whatsAppMessage.findMany({
      take: 6,
      where: { statusEnvio: WhatsAppSendStatus.FAILED },
      orderBy: { createdAt: "desc" },
      include: {
        reservation: { select: { codigo: true } },
        participant: { select: { nome: true } },
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: ReservationStatus.PAID,
        paidAt: { gte: fourteenDaysAgo },
      },
      select: { paidAt: true, valorTotal: true },
    }),
  ]);

  const chartMap = new Map<string, { count: number; revenue: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    chartMap.set(key, { count: 0, revenue: 0 });
  }
  for (const row of paidLast14) {
    if (!row.paidAt) continue;
    const key = row.paidAt.toISOString().slice(0, 10);
    if (!chartMap.has(key)) continue;
    const cur = chartMap.get(key)!;
    cur.count += 1;
    cur.revenue += Number(row.valorTotal);
  }
  const chartSeries = Array.from(chartMap.entries()).map(([date, v]) => ({
    date,
    paidCount: v.count,
    revenue: v.revenue,
  }));

  const mainRaffle = await prisma.raffle.findFirst({
    where: { status: RaffleStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { numbers: true } },
    },
  });
  let mainProgress: { titulo: string; slug: string; paid: number; total: number; pct: number } | null = null;
  if (mainRaffle) {
    const paid = await prisma.raffleNumber.count({
      where: { raffleId: mainRaffle.id, status: "PAID" },
    });
    const total = mainRaffle._count.numbers;
    mainProgress = {
      titulo: mainRaffle.titulo,
      slug: mainRaffle.slug,
      paid,
      total,
      pct: total ? Math.round((paid / total) * 1000) / 10 : 0,
    };
  }

  const paidResList = await prisma.reservation.findMany({
    where: { status: ReservationStatus.PAID },
    select: {
      participantId: true,
      valorTotal: true,
      _count: { select: { numbers: true } },
    },
  });
  const agg = new Map<string, { qty: number; spent: number }>();
  for (const r of paidResList) {
    const cur = agg.get(r.participantId) ?? { qty: 0, spent: 0 };
    cur.spent += Number(r.valorTotal);
    cur.qty += r._count.numbers;
    agg.set(r.participantId, cur);
  }
  const topIds = [...agg.entries()]
    .sort((a, b) => b[1].spent - a[1].spent)
    .slice(0, 5);
  const topParts = await prisma.participant.findMany({
    where: { id: { in: topIds.map(([id]) => id) } },
    select: { id: true, nome: true, telefone: true },
  });
  const topBuyers = topIds.map(([pid, v]) => {
    const p = topParts.find((x) => x.id === pid);
    return {
      nome: p?.nome ?? "?",
      telefone: p?.telefone ?? "",
      qty: v.qty,
      spent: v.spent,
    };
  });

  return NextResponse.json({
    totalRaffles,
    activeRaffles,
    paidNumbers,
    pendingReservations: pendingRes,
    paidToday,
    expiredPix,
    whatsappFailed: failedWa,
    whatsappPending: pendingWa,
    totalRevenue: revenue._sum.valorTotal ? Number(revenue._sum.valorTotal) : 0,
    webhooksPending,
    webhooksFailed,
    failedPix,
    chartSeries,
    mainProgress,
    topBuyers,
    recentReservations,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      valor: Number(p.valor),
      paidAt: p.paidAt,
      externalPaymentId: p.externalPaymentId,
      codigo: p.reservation.codigo,
      rifa: p.reservation.raffle.titulo,
    })),
    failedWebhooksList,
    failedWaList: failedWaList.map((w) => ({
      id: w.id,
      codigo: w.reservation.codigo,
      nome: w.participant.nome,
      erro: w.erro,
      tentativas: w.tentativas,
    })),
  });
}
