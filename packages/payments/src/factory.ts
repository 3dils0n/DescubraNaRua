import { createMercadoPagoProvider } from "./mercadopago.provider";
import { MockPixProvider } from "./mock.provider";
import type { PixPaymentProvider } from "./types";
import { getEffectivePixConfig } from "./pix-config";

type CacheEntry = { provider: PixPaymentProvider; key: string };

let cached: CacheEntry | null = null;

function configKey(parts: { pixProvider: string; accessToken: string; webhookSecret: string }): string {
  return `${parts.pixProvider}:${parts.accessToken}:${parts.webhookSecret}`;
}

export function resetPixProviderCache(): void {
  cached = null;
}

/**
 * Provider Pix efetivo (mock ou Mercado Pago), com credenciais do painel admin ou .env.
 */
export async function getPixProvider(): Promise<PixPaymentProvider> {
  const cfg = await getEffectivePixConfig();
  const key = configKey({
    pixProvider: cfg.pixProvider,
    accessToken: cfg.accessToken ?? "",
    webhookSecret: cfg.webhookSecret ?? "",
  });
  if (cached && cached.key === key) return cached.provider;

  if (cfg.pixProvider === "mercadopago") {
    if (!cfg.accessToken) {
      throw new Error(
        "MERCADO_PAGO_ACCESS_TOKEN ausente: defina no painel (Configurações) ou no .env (MERCADO_PAGO_ACCESS_TOKEN / MP_ACCESS_TOKEN).",
      );
    }
    cached = {
      provider: createMercadoPagoProvider(cfg.accessToken, cfg.webhookSecret),
      key,
    };
  } else {
    cached = { provider: new MockPixProvider(), key };
  }
  return cached.provider;
}
