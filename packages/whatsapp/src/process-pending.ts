import { prisma } from "@repo/db";
import { getPublicAppUrl, getRetryDelayMsAfterFailure, log } from "@repo/shared";
import {
  WhatsAppMessageType,
  WhatsAppSendStatus,
} from "@prisma/client";
import { getWhatsAppProvider } from "./factory";
import type { PaymentApprovedPayload } from "./types";

const MAX_WHATSAPP_ATTEMPTS = 5;

export async function processPendingWhatsAppBatch(limit = 25): Promise<{ processed: number }> {
  const now = new Date();
  const pending = await prisma.whatsAppMessage.findMany({
    where: {
      statusEnvio: WhatsAppSendStatus.PENDING,
      tipoMensagem: WhatsAppMessageType.PAYMENT_APPROVED,
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
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
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const msg of pending) {
    const res = msg.reservation;
    if (!res) continue;

    const pix = await prisma.pixPayment.findFirst({
      where: { reservationId: res.id },
      orderBy: { createdAt: "desc" },
    });

    const base = getPublicAppUrl();
    const consultUrl = `${base}/consulta?codigo=${encodeURIComponent(res.codigo)}`;
    const amount = Number(res.valorTotal);
    const amountFormatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const nums = res.numbers.map((n) => n.raffleNumber.numero).sort();
    const phoneDigits = res.participant.telefone.replace(/\D/g, "");
    const phoneE164 = phoneDigits.startsWith("55") ? `+${phoneDigits}` : `+55${phoneDigits}`;

    const payload: PaymentApprovedPayload = {
      phoneE164,
      participantName: res.participant.nome,
      raffleTitle: res.raffle.titulo,
      numbers: nums,
      quantity: res.quantidade,
      amountFormatted,
      consultUrl,
    };

    try {
      const provider = getWhatsAppProvider();
      const result = await provider.sendPaymentApprovedMessage(payload);
      const newTentativas = msg.tentativas + 1;

      if (result.ok) {
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            statusEnvio: WhatsAppSendStatus.SENT,
            providerMessageId: result.messageId,
            erro: result.error,
            tentativas: newTentativas,
            sentAt: new Date(),
            nextRetryAt: null,
          },
        });
        log.whatsappSent({
          reserva_id: res.id,
          external_payment_id: pix?.externalPaymentId ?? undefined,
          txid: pix?.txid ?? undefined,
        });
      } else {
        const dead = newTentativas > MAX_WHATSAPP_ATTEMPTS;
        const delayMs = getRetryDelayMsAfterFailure(newTentativas);
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            statusEnvio: dead ? WhatsAppSendStatus.FAILED : WhatsAppSendStatus.PENDING,
            erro: result.error,
            tentativas: newTentativas,
            nextRetryAt: dead ? null : new Date(Date.now() + delayMs),
          },
        });
        log.warn(dead ? "whatsapp falhou definitivamente" : "whatsapp falhou, retry agendado", {
          reserva_id: res.id,
          external_payment_id: pix?.externalPaymentId ?? undefined,
          txid: pix?.txid ?? undefined,
        });
      }
      processed += 1;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "unknown";
      const newTentativas = msg.tentativas + 1;
      const dead = newTentativas > MAX_WHATSAPP_ATTEMPTS;
      const delayMs = getRetryDelayMsAfterFailure(newTentativas);
      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: {
          statusEnvio: dead ? WhatsAppSendStatus.FAILED : WhatsAppSendStatus.PENDING,
          erro: errMsg,
          tentativas: newTentativas,
          nextRetryAt: dead ? null : new Date(Date.now() + delayMs),
        },
      });
      log.error("whatsapp exceção no envio", {
        reserva_id: res.id,
        external_payment_id: pix?.externalPaymentId ?? undefined,
        txid: pix?.txid ?? undefined,
        erro: errMsg,
      });
      processed += 1;
    }
  }

  return { processed };
}
