import { getEnv } from "@repo/shared";
import { ConsoleWhatsAppProvider } from "./console.provider";
import { MetaWhatsAppProvider } from "./meta.provider";
import type { WhatsAppProvider } from "./types";

let cached: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (cached) return cached;
  const p = getEnv().WHATSAPP_PROVIDER;
  if (p === "meta") {
    cached = new MetaWhatsAppProvider();
  } else {
    cached = new ConsoleWhatsAppProvider();
  }
  return cached;
}
