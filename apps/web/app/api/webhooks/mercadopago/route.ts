import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { verifyMercadoPagoWebhookSignature } from "@repo/payments";
import { log } from "@repo/shared";
import { PixProvider, WebhookInboxStatus } from "@prisma/client";

/**
 * Recebe webhook do Mercado Pago, persiste na fila (webhook_inbox) e responde rápido.
 * O rifa-worker processa assincronamente (confirmação + WhatsApp).
 */
export async function POST(req: Request) {
  const raw = await req.text();

  const sig = verifyMercadoPagoWebhookSignature(raw, req.headers);
  if (!sig.ok) {
    log.warn("webhook rejeitado (assinatura ou payload)", { erro: sig.reason });
    return NextResponse.json({ ok: false, reason: sig.reason }, { status: 401 });
  }

  let parsed: { type?: string; topic?: string; action?: string; data?: { id?: string | number } };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const action = String(parsed?.type ?? parsed?.topic ?? parsed?.action ?? "");
  const isPaymentTopic = action.toLowerCase().includes("payment");
  if (isPaymentTopic && (parsed?.data?.id == null || parsed.data.id === "")) {
    log.warn("webhook rejeitado (payment sem data.id)", {});
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId = parsed?.data?.id != null ? String(parsed.data.id) : null;
  const topic = parsed?.type ?? parsed?.topic ?? parsed?.action ?? "unknown";
  const idempotencyKey = paymentId ? `mp:${topic}:${paymentId}` : `mp:${topic}:${Date.now()}`;

  log.webhookReceived({
    external_payment_id: paymentId ?? undefined,
    webhook_inbox_id: undefined,
  });

  if (paymentId) {
    const existing = await prisma.webhookInbox.findUnique({
      where: { idempotencyKey: `mp:${topic}:${paymentId}` },
    });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  const headersJson = {
    "x-signature": req.headers.get("x-signature"),
    "x-request-id": req.headers.get("x-request-id"),
  };

  try {
    await prisma.webhookInbox.create({
      data: {
        provider: PixProvider.MERCADOPAGO,
        idempotencyKey: paymentId ? `mp:${topic}:${paymentId}` : idempotencyKey,
        topic,
        resourceId: paymentId,
        payload: JSON.parse(raw) as object,
        headersJson,
        status: WebhookInboxStatus.PENDING,
        nextRetryAt: null,
      },
    });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  log.webhookEnqueued({
    external_payment_id: paymentId ?? undefined,
  });

  return NextResponse.json({ ok: true, queued: true });
}
