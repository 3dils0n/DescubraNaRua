export type CreatePixInput = {
  amount: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  payerFirstName: string;
  payerLastName: string;
  payerCpf?: string;
  notificationUrl: string;
  idempotencyKey?: string;
};

export type CreatePixResult = {
  provider: "MERCADOPAGO" | "MOCK";
  externalPaymentId: string;
  externalReference: string;
  txid?: string;
  statusGateway: string;
  qrCodeText?: string;
  qrCodeBase64?: string;
  pixCopiaECola?: string;
  expiresAt: Date;
  raw: unknown;
};

export type PaymentStatusResult = {
  externalPaymentId: string;
  statusGateway: string;
  statusApproved: boolean;
  paidAt?: Date;
  raw: unknown;
};

export interface PixPaymentProvider {
  createPixPayment(input: CreatePixInput): Promise<CreatePixResult>;
  getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult>;
  cancelPayment(externalPaymentId: string): Promise<{ ok: boolean; raw?: unknown }>;
  verifyWebhookSignature?(payload: string, headers: Headers): boolean;
}
