import { prisma } from "@repo/db";
import { PixInternalStatus, RaffleNumberStatus, ReservationStatus } from "@prisma/client";

export async function expirePendingReservations(): Promise<{ released: number }> {
  const now = new Date();
  const expired = await prisma.reservation.findMany({
    where: { status: ReservationStatus.PENDING, expiresAt: { lt: now } },
    include: { numbers: true },
  });

  let released = 0;
  for (const res of expired) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({ where: { id: res.id } });
      if (!current || current.status !== ReservationStatus.PENDING) return;

      await tx.raffleNumber.updateMany({
        where: {
          id: { in: res.numbers.map((n) => n.raffleNumberId) },
          status: RaffleNumberStatus.RESERVED,
        },
        data: { status: RaffleNumberStatus.AVAILABLE },
      });

      await tx.reservation.update({
        where: { id: res.id },
        data: { status: ReservationStatus.EXPIRED },
      });

      await tx.pixPayment.updateMany({
        where: { reservationId: res.id, statusInterno: PixInternalStatus.PENDING },
        data: { statusInterno: PixInternalStatus.EXPIRED },
      });

      released += 1;
    });
  }

  return { released };
}
