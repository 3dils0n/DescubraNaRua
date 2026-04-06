import { prisma } from "@repo/db";
import { maskName } from "../mask";
import { RaffleNumberStatus, ReservationStatus } from "@prisma/client";

export async function getRafflePublicStats(raffleId: string) {
  const [total, paid, reserved, pendingRes, recentPaid] = await Promise.all([
    prisma.raffleNumber.count({ where: { raffleId } }),
    prisma.raffleNumber.count({ where: { raffleId, status: RaffleNumberStatus.PAID } }),
    prisma.raffleNumber.count({ where: { raffleId, status: RaffleNumberStatus.RESERVED } }),
    prisma.reservation.count({
      where: { raffleId, status: ReservationStatus.PENDING },
    }),
    prisma.reservation.findMany({
      where: { raffleId, status: ReservationStatus.PAID },
      orderBy: { paidAt: "desc" },
      take: 12,
      include: { participant: true },
    }),
  ]);

  const sold = paid;
  const remaining = total - paid - reserved;
  const pct = total > 0 ? Math.round((sold / total) * 1000) / 10 : 0;

  return {
    totalNumbers: total,
    sold,
    reserved,
    pendingReservations: pendingRes,
    remaining: Math.max(0, remaining),
    percentSold: pct,
    recentPurchases: recentPaid.map((r) => ({
      name: maskName(r.participant.nome),
      qty: r.quantidade,
      at: r.paidAt?.toISOString() ?? r.createdAt.toISOString(),
    })),
  };
}

export async function getBuyerRanking(raffleId: string, limit: number, anonymize: boolean) {
  const rows = await prisma.reservation.groupBy({
    by: ["participantId"],
    where: { raffleId, status: ReservationStatus.PAID },
    _sum: { quantidade: true, valorTotal: true },
    orderBy: { _sum: { quantidade: "desc" } },
    take: limit,
  });

  const participants = await prisma.participant.findMany({
    where: { id: { in: rows.map((r) => r.participantId) } },
  });
  const map = new Map(participants.map((p) => [p.id, p]));

  return rows.map((r, i) => {
    const p = map.get(r.participantId);
    const name = p ? (anonymize ? maskName(p.nome) : p.nome) : "***";
    return {
      position: i + 1,
      name,
      quantity: r._sum.quantidade ?? 0,
      totalSpent: r._sum.valorTotal ? Number(r._sum.valorTotal) : 0,
    };
  });
}
