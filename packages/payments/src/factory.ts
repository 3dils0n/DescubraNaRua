import { getEnv } from "@repo/shared";
import { createMercadoPagoProviderFromEnv } from "./mercadopago.provider";
import { MockPixProvider } from "./mock.provider";
import type { PixPaymentProvider } from "./types";

let cached: PixPaymentProvider | null = null;

export function getPixProvider(): PixPaymentProvider {
  if (cached) return cached;
  const env = getEnv();
  if (env.PIX_PROVIDER === "mercadopago") {
    cached = createMercadoPagoProviderFromEnv();
  } else {
    cached = new MockPixProvider();
  }
  return cached;
}
