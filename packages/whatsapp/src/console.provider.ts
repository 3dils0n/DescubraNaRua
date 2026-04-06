import type {
  PaymentApprovedPayload,
  PaymentPendingReminderPayload,
  ReservationCreatedPayload,
  WhatsAppProvider,
} from "./types";

export class ConsoleWhatsAppProvider implements WhatsAppProvider {
  async sendPaymentApprovedMessage(data: PaymentApprovedPayload) {
    // eslint-disable-next-line no-console
    console.log("[WhatsApp APPROVED]", JSON.stringify(data, null, 2));
    return { ok: true, messageId: "console" };
  }

  async sendReservationCreatedMessage(data: ReservationCreatedPayload) {
    // eslint-disable-next-line no-console
    console.log("[WhatsApp RESERVATION]", JSON.stringify(data, null, 2));
    return { ok: true, messageId: "console" };
  }

  async sendPaymentPendingReminder(data: PaymentPendingReminderPayload) {
    // eslint-disable-next-line no-console
    console.log("[WhatsApp REMINDER]", JSON.stringify(data, null, 2));
    return { ok: true, messageId: "console" };
  }
}
