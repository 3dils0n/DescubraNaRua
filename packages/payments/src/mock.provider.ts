import QRCode from "qrcode";
import type { CreatePixInput, CreatePixResult, PaymentStatusResult, PixPaymentProvider } from "./types";

export class MockPixProvider implements PixPaymentProvider {
  async createPixPayment(input: CreatePixInput): Promise<CreatePixResult> {
    const externalPaymentId = `mock_${Date.now()}`;
    const pix =
      "00020126580014br.gov.bcb.pix0136" +
      externalPaymentId +
      "5204000053039865802BR5913MOCK6009SAO PAULO62070503***6304ABCD";
    const qrCodeBase64 = await QRCode.toDataURL(pix, { margin: 1, width: 256 });
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    return {
      provider: "MOCK",
      externalPaymentId,
      externalReference: input.externalReference,
      txid: `MOCKTX${externalPaymentId.slice(-8)}`,
      statusGateway: "pending",
      qrCodeText: pix,
      qrCodeBase64: qrCodeBase64.replace(/^data:image\/png;base64,/, ""),
      pixCopiaECola: pix,
      expiresAt,
      raw: { mock: true },
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult> {
    return {
      externalPaymentId,
      statusGateway: "pending",
      statusApproved: false,
      raw: { mock: true },
    };
  }

  async cancelPayment(externalPaymentId: string) {
    return { ok: true, raw: { mock: true, externalPaymentId } };
  }
}
