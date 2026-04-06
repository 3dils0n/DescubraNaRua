import type { PaymentApprovedPayload, WhatsAppProvider } from "./types";

export class MetaWhatsAppProvider implements WhatsAppProvider {
  async sendPaymentApprovedMessage(data: PaymentApprovedPayload) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_META_PHONE_ID;
    if (!token || !phoneId) {
      return { ok: false, error: "Meta WhatsApp não configurado" };
    }
    const to = data.phoneE164.replace(/\D/g, "");
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: `Pagamento confirmado! ${data.raffleTitle} — ${data.numbers.join(", ")}`,
      },
    };
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      const json = (await res.json()) as { messages?: { id?: string }[] };
      return { ok: true, messageId: json.messages?.[0]?.id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "erro" };
    }
  }
}
