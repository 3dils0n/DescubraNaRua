import { prisma } from "@repo/db";
import { PixProvider as PixProviderEnum } from "@prisma/client";
import { getEnv } from "@repo/shared";

export type EffectivePixProvider = "mock" | "mercadopago";

export type EffectivePixConfig = {
  pixProvider: EffectivePixProvider;
  accessToken: string | undefined;
  webhookSecret: string | undefined;
};

/**
 * Resolve Pix Mercado Pago: valores guardados no painel (app_settings) têm prioridade sobre o .env quando preenchidos.
 * `pix_provider_override` null = usar PIX_PROVIDER do ambiente.
 */
export async function getEffectivePixConfig(): Promise<EffectivePixConfig> {
  const row = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const env = getEnv();
  const envProv: EffectivePixProvider = env.PIX_PROVIDER === "mercadopago" ? "mercadopago" : "mock";

  const pixProvider: EffectivePixProvider =
    row?.pixProviderOverride != null
      ? row.pixProviderOverride === PixProviderEnum.MERCADOPAGO
        ? "mercadopago"
        : "mock"
      : envProv;

  const accessTokenFromEnv =
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || process.env.MP_ACCESS_TOKEN?.trim() || undefined;
  const webhookFromEnv =
    process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || process.env.MP_WEBHOOK_SECRET?.trim() || undefined;

  const accessToken =
    row?.mercadoPagoAccessToken != null && row.mercadoPagoAccessToken.trim() !== ""
      ? row.mercadoPagoAccessToken.trim()
      : accessTokenFromEnv;

  const webhookSecret =
    row?.mercadoPagoWebhookSecret != null && row.mercadoPagoWebhookSecret.trim() !== ""
      ? row.mercadoPagoWebhookSecret.trim()
      : webhookFromEnv;

  return { pixProvider, accessToken, webhookSecret };
}

export async function getEffectiveMercadoPagoWebhookSecret(): Promise<string | undefined> {
  const cfg = await getEffectivePixConfig();
  return cfg.webhookSecret;
}
