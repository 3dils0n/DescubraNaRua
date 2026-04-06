import { prisma } from "@repo/db";
import { PixInternalStatus } from "@prisma/client";
import { syncPaymentStatusFromGateway } from "./confirm-payment";

/** Reconsulta Pix pendentes antigos — idempotente */
export async function resyncStalePendingPixPayments(olderThanMinutes = 8): Promise<{ checked: number }> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const rows = await prisma.pixPayment.findMany({
    where: {
      statusInterno: PixInternalStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  let checked = 0;
  for (const p of rows) {
    await syncPaymentStatusFromGateway(p.id);
    checked += 1;
  }
  return { checked };
}
