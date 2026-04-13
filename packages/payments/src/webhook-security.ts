import crypto from "crypto";
import { getEffectiveMercadoPagoWebhookSecret } from "./pix-config";

/**
 * Valida assinatura Mercado Pago (x-signature + x-request-id).
 * Usa segredo efetivo (painel admin + .env). Se nenhum segredo estiver definido, aceita (dev/mock).
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export async function verifyMercadoPagoWebhookSignature(
  rawBody: string,
  headers: Headers,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = await getEffectiveMercadoPagoWebhookSecret();
  if (!secret) return { ok: true };

  let parsed: { data?: { id?: string | number } };
  try {
    parsed = JSON.parse(rawBody) as typeof parsed;
  } catch {
    return { ok: false, reason: "JSON_INVALIDO" };
  }

  const dataId = parsed?.data?.id != null ? String(parsed.data.id) : "";
  if (!dataId) return { ok: false, reason: "PAYLOAD_SEM_DATA_ID" };

  const sigHeader = headers.get("x-signature") ?? headers.get("X-Signature") ?? "";
  const requestId = headers.get("x-request-id") ?? headers.get("X-Request-Id") ?? "";

  if (!sigHeader || !requestId) {
    return { ok: false, reason: "HEADERS_ASSINATURA_AUSENTES" };
  }

  const parts: Record<string, string> = {};
  for (const part of sigHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    parts[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, reason: "ASSINATURA_MALFORMADA" };

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  if (hmac !== v1) {
    return { ok: false, reason: "ASSINATURA_INVALIDA" };
  }

  return { ok: true };
}
