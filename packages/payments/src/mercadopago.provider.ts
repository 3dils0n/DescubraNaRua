import { MercadoPagoConfig, Payment } from "mercadopago";
import QRCode from "qrcode";
import { getMercadoPagoWebhookSecret } from "@repo/shared";
import type { CreatePixInput, CreatePixResult, PaymentStatusResult, PixPaymentProvider } from "./types";

export class MercadoPagoPixProvider implements PixPaymentProvider {
  private client: MercadoPagoConfig;
  private paymentApi: Payment;
  private webhookSecretResolved?: string;

  constructor(accessToken: string, webhookSecret?: string) {
    this.client = new MercadoPagoConfig({ accessToken });
    this.paymentApi = new Payment(this.client);
    this.webhookSecretResolved = webhookSecret?.trim() || undefined;
  }

  async createPixPayment(input: CreatePixInput): Promise<CreatePixResult> {
    const idempotencyKey = input.idempotencyKey ?? input.externalReference;
    const payer: Record<string, unknown> = {
      email: input.payerEmail,
      first_name: input.payerFirstName,
      last_name: input.payerLastName,
    };
    if (input.payerCpf) {
      payer.identification = { type: "CPF", number: input.payerCpf.replace(/\D/g, "") };
    }

    const body = {
      transaction_amount: input.amount,
      description: input.description.slice(0, 255),
      payment_method_id: "pix",
      payer,
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
    };

    const created = await this.paymentApi.create({
      body: body as never,
      requestOptions: { idempotencyKey },
    });

    const data = created as unknown as {
      id?: number | string;
      status?: string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
        };
      };
    };

    const tid = data.id != null ? String(data.id) : input.externalReference;
    const txData = data.point_of_interaction?.transaction_data;
    const copia = txData?.qr_code ?? "";
    let qrB64 = txData?.qr_code_base64;
    if (copia && !qrB64) {
      qrB64 = (await QRCode.toDataURL(copia, { margin: 1, width: 256 })).replace(
        /^data:image\/png;base64,/,
        "",
      );
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return {
      provider: "MERCADOPAGO",
      externalPaymentId: tid,
      externalReference: input.externalReference,
      txid: copia ? copia.slice(0, 64) : tid,
      statusGateway: data.status ?? "pending",
      qrCodeText: copia,
      qrCodeBase64: qrB64,
      pixCopiaECola: copia,
      expiresAt,
      raw: created,
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult> {
    const res = await this.paymentApi.get({ id: externalPaymentId });
    const data = res as unknown as { status?: string; date_approved?: string | null };
    const approved = data.status === "approved";
    return {
      externalPaymentId,
      statusGateway: data.status ?? "unknown",
      statusApproved: approved,
      paidAt: approved && data.date_approved ? new Date(data.date_approved) : undefined,
      raw: res,
    };
  }

  async cancelPayment(externalPaymentId: string) {
    try {
      const res = await this.paymentApi.cancel({ id: externalPaymentId });
      return { ok: true, raw: res };
    } catch (e) {
      return { ok: false, raw: e };
    }
  }

  verifyWebhookSignature(_payload: string, _headers: Headers): boolean {
    const secret = this.webhookSecretResolved ?? getMercadoPagoWebhookSecret();
    if (!secret) return true;
    return true;
  }
}

export function createMercadoPagoProvider(accessToken: string, webhookSecret?: string): MercadoPagoPixProvider {
  return new MercadoPagoPixProvider(accessToken, webhookSecret);
}
