export type PaymentApprovedPayload = {
  phoneE164: string;
  participantName: string;
  raffleTitle: string;
  numbers: string[];
  quantity: number;
  amountFormatted: string;
  consultUrl: string;
};

export type ReservationCreatedPayload = {
  participantName: string;
  raffleTitle: string;
  reservationCode: string;
  consultUrl: string;
};

export type PaymentPendingReminderPayload = {
  participantName: string;
  raffleTitle: string;
  amountFormatted: string;
  expiresAt: string;
  consultUrl: string;
};

export interface WhatsAppProvider {
  sendPaymentApprovedMessage(
    data: PaymentApprovedPayload,
  ): Promise<{ ok: boolean; messageId?: string; error?: string }>;
  sendReservationCreatedMessage?(
    data: ReservationCreatedPayload,
  ): Promise<{ ok: boolean; messageId?: string; error?: string }>;
  sendPaymentPendingReminder?(
    data: PaymentPendingReminderPayload,
  ): Promise<{ ok: boolean; messageId?: string; error?: string }>;
}
