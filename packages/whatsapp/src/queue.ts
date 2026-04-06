import { prisma } from "@repo/db";
import { getPublicAppUrl } from "@repo/shared";
import {
  WhatsAppMessageType,
  WhatsAppProvider as WpProviderEnum,
  WhatsAppSendStatus,
} from "@prisma/client";

/** Enfileira mensagem (PENDING) — envio pelo worker */
export async function queueWhatsAppPaymentApproved(reservationId: string): Promise<void> {
  const dup = await prisma.whatsAppMessage.findFirst({
    where: {
      reservationId,
      tipoMensagem: WhatsAppMessageType.PAYMENT_APPROVED,
      statusEnvio: { in: [WhatsAppSendStatus.PENDING, WhatsAppSendStatus.SENT] },
    },
  });
  if (dup) return;

  const res = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      raffle: true,
      participant: true,
      numbers: { include: { raffleNumber: true } },
    },
  });
  if (!res || !res.raffle.ativarWhatsapp) return;

  const base = getPublicAppUrl();
  const consultUrl = `${base}/consulta?codigo=${encodeURIComponent(res.codigo)}`;
  const amount = Number(res.valorTotal);
  const amountFormatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const nums = res.numbers.map((n) => n.raffleNumber.numero).sort();

  const text =
    res.raffle.mensagemWhatsappPadrao?.trim() ||
    [
      "Pagamento confirmado com sucesso!",
      `Rifa: ${res.raffle.titulo}`,
      `Seus números: ${nums.join(", ")}`,
      `Quantidade: ${res.quantidade}`,
      `Valor pago: ${amountFormatted}`,
      `Consulte: ${consultUrl}`,
      "Boa sorte!",
    ].join("\n");

  const wp = process.env.WHATSAPP_PROVIDER ?? "console";
  const providerEnum =
    wp === "meta"
      ? WpProviderEnum.META
      : wp === "zapi"
        ? WpProviderEnum.ZAPI
        : wp === "evolution"
          ? WpProviderEnum.EVOLUTION
          : wp === "mock"
            ? WpProviderEnum.MOCK
            : WpProviderEnum.CONSOLE;

  await prisma.whatsAppMessage.create({
    data: {
      reservationId: res.id,
      participantId: res.participantId,
      provider: providerEnum,
      telefone: res.participant.telefone,
      tipoMensagem: WhatsAppMessageType.PAYMENT_APPROVED,
      conteudo: text,
      statusEnvio: WhatsAppSendStatus.PENDING,
      tentativas: 0,
      nextRetryAt: null,
    },
  });
}
