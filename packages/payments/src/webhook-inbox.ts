import { prisma } from "@repo/db";
import { WebhookInboxStatus } from "@prisma/client";
import { getRetryDelayMsAfterFailure, log } from "@repo/shared";
import { applyApprovedPaymentByExternalPaymentId } from "./confirm-payment";
import { getPixProvider } from "./factory";

/** Após 5 falhas acumuladas, dead letter (não reprocessa) */
const MAX_ATTEMPTS_BEFORE_DEAD_LETTER = 5;

export async function processWebhookInboxBatch(limit = 20): Promise<{ done: number; errors: number }> {
  const now = new Date();
  const batch = await prisma.webhookInbox.findMany({
    where: {
      status: WebhookInboxStatus.PENDING,
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let done = 0;
  let errors = 0;

  for (const job of batch) {
    log.workerInboxStart({
      webhook_inbox_id: job.id,
      external_payment_id: job.resourceId ?? undefined,
    });

    const lock = await prisma.webhookInbox.updateMany({
      where: {
        id: job.id,
        status: WebhookInboxStatus.PENDING,
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      data: { status: WebhookInboxStatus.PROCESSING },
    });
    if (lock.count === 0) continue;

    try {
      const paymentId = job.resourceId;
      if (!paymentId) {
        await prisma.webhookInbox.update({
          where: { id: job.id },
          data: {
            status: WebhookInboxStatus.COMPLETED,
            processedAt: new Date(),
            lastError: null,
            nextRetryAt: null,
          },
        });
        done += 1;
        continue;
      }

      const provider = await getPixProvider();
      const status = await provider.getPaymentStatus(paymentId);
      if (status.statusApproved) {
        await applyApprovedPaymentByExternalPaymentId(paymentId);
      }

      await prisma.webhookInbox.update({
        where: { id: job.id },
        data: {
          status: WebhookInboxStatus.COMPLETED,
          processedAt: new Date(),
          lastError: null,
          nextRetryAt: null,
        },
      });
      done += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      const newAttempts = job.attempts + 1;
      const dead = newAttempts > MAX_ATTEMPTS_BEFORE_DEAD_LETTER;
      const delayMs = getRetryDelayMsAfterFailure(newAttempts);
      const nextAt = dead ? null : new Date(Date.now() + delayMs);

      await prisma.webhookInbox.update({
        where: { id: job.id },
        data: {
          status: dead ? WebhookInboxStatus.FAILED : WebhookInboxStatus.PENDING,
          attempts: newAttempts,
          lastError: msg,
          nextRetryAt: nextAt,
          processedAt: dead ? new Date() : null,
        },
      });

      if (dead) {
        log.error("webhook_inbox dead letter após tentativas", {
          webhook_inbox_id: job.id,
          external_payment_id: job.resourceId ?? undefined,
          erro: msg,
        });
      }
      errors += 1;
    }
  }

  return { done, errors };
}
