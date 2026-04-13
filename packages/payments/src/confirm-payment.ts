import { prisma } from "@repo/db";
import { queueWhatsAppPaymentApproved } from "@repo/whatsapp";
import { log } from "@repo/shared";
import {
  PixInternalStatus,
  RaffleNumberStatus,
  ReservationStatus,
} from "@prisma/client";
import { getPixProvider } from "./factory";

/**
 * Confirma pagamento de forma idempotente (external_payment_id ou txid do gateway).
 * Transação única: pix PENDING→APPROVED, reserva PENDING→PAID, números RESERVED→PAID (condicionais).
 */
export async function applyApprovedPaymentByExternalPaymentId(
  externalPaymentId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const pix = await prisma.pixPayment.findFirst({
    where: {
      OR: [{ externalPaymentId }, { txid: externalPaymentId }],
    },
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

  if (!pix) {
    log.warn("pagamento não encontrado", { external_payment_id: externalPaymentId });
    return { ok: false, reason: "PAYMENT_NOT_FOUND" };
  }

  if (pix.statusInterno === PixInternalStatus.APPROVED) {
    log.paymentIdempotent({
      external_payment_id: pix.externalPaymentId,
      txid: pix.txid,
      reserva_id: pix.reservationId,
    });
    return { ok: true, reason: "ALREADY_APPROVED" };
  }

  const res = pix.reservation;
  if (res.status === ReservationStatus.PAID) {
    log.paymentIdempotent({
      external_payment_id: pix.externalPaymentId,
      txid: pix.txid,
      reserva_id: res.id,
    });
    return { ok: true, reason: "RESERVATION_ALREADY_PAID" };
  }

  const numberIds = res.numbers.map((n) => n.raffleNumberId);

  let transitionedReservation = false;

  await prisma.$transaction(async (tx) => {
    const pixRows = await tx.pixPayment.updateMany({
      where: { id: pix.id, statusInterno: PixInternalStatus.PENDING },
      data: {
        statusInterno: PixInternalStatus.APPROVED,
        statusGateway: "approved",
        paidAt: new Date(),
        webhookReceivedAt: new Date(),
      },
    });

    if (pixRows.count === 0) {
      const pixNow = await tx.pixPayment.findUnique({ where: { id: pix.id } });
      if (pixNow?.statusInterno === PixInternalStatus.APPROVED) {
        const resRows = await tx.reservation.updateMany({
          where: { id: res.id, status: ReservationStatus.PENDING },
          data: { status: ReservationStatus.PAID, paidAt: new Date() },
        });
        if (resRows.count > 0) {
          await tx.raffleNumber.updateMany({
            where: {
              id: { in: numberIds },
              status: RaffleNumberStatus.RESERVED,
            },
            data: { status: RaffleNumberStatus.PAID },
          });
          transitionedReservation = true;
        }
        return;
      }
      log.warn("pix não estava PENDING nem APPROVED após corrida", {
        external_payment_id: pix.externalPaymentId,
        txid: pix.txid,
        reserva_id: res.id,
      });
      return;
    }

    const resRows = await tx.reservation.updateMany({
      where: { id: res.id, status: ReservationStatus.PENDING },
      data: { status: ReservationStatus.PAID, paidAt: new Date() },
    });

    if (resRows.count === 0) {
      const resNow = await tx.reservation.findUnique({ where: { id: res.id } });
      if (resNow?.status === ReservationStatus.PAID) {
        await tx.raffleNumber.updateMany({
          where: {
            id: { in: numberIds },
            status: RaffleNumberStatus.RESERVED,
          },
          data: { status: RaffleNumberStatus.PAID },
        });
      } else {
        log.warn("pix aprovado mas reserva não está PENDING nem PAID", {
          external_payment_id: pix.externalPaymentId,
          txid: pix.txid,
          reserva_id: res.id,
        });
      }
      return;
    }

    transitionedReservation = true;

    await tx.raffleNumber.updateMany({
      where: {
        id: { in: numberIds },
        status: RaffleNumberStatus.RESERVED,
      },
      data: { status: RaffleNumberStatus.PAID },
    });
  });

  if (transitionedReservation) {
    log.paymentApplied({
      external_payment_id: pix.externalPaymentId,
      txid: pix.txid,
      reserva_id: pix.reservationId,
    });
    await queueWhatsAppPaymentApproved(pix.reservationId).catch((e) => {
      log.error("fila whatsapp após pagamento", {
        reserva_id: pix.reservationId,
        external_payment_id: pix.externalPaymentId,
        txid: pix.txid,
        erro: e instanceof Error ? e.message : String(e),
      });
    });
  }

  return { ok: true };
}

export async function syncPaymentStatusFromGateway(pixPaymentId: string): Promise<{ ok: boolean }> {
  const pix = await prisma.pixPayment.findUnique({
    where: { id: pixPaymentId },
  });
  if (!pix?.externalPaymentId) return { ok: false };

  const provider = await getPixProvider();
  const status = await provider.getPaymentStatus(pix.externalPaymentId);

  if (status.statusApproved) {
    await applyApprovedPaymentByExternalPaymentId(pix.externalPaymentId);
  } else if (["rejected", "cancelled", "refunded"].includes(status.statusGateway)) {
    await prisma.pixPayment.update({
      where: { id: pix.id },
      data: { statusInterno: PixInternalStatus.FAILED, statusGateway: status.statusGateway },
    });
  }

  return { ok: true };
}
