import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { PixInternalStatus, RaffleStatus, ReservationStatus, WhatsAppSendStatus } from "@prisma/client";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRaffles,
    activeRaffles,
    paidReservations,
    pendingRes,
    paidToday,
    expiredPix,
    failedWa,
    revenue,
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
    prisma.reservation.aggregate({
      where: { status: ReservationStatus.PAID },
      _sum: { valorTotal: true },
    }),
  ]);

  return NextResponse.json({
    totalRaffles,
    activeRaffles,
    paidNumbers: paidReservations,
    pendingReservations: pendingRes,
    paidToday,
    expiredPix,
    whatsappFailed: failedWa,
    totalRevenue: revenue._sum.valorTotal ? Number(revenue._sum.valorTotal) : 0,
  });
}
