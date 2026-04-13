import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  getDefaultReservationExpirationMinutes,
  getRankingCacheTtlSeconds,
  getRecentPurchasesWindowMinutes,
} from "@repo/shared";

function set(v: string | undefined): boolean {
  return Boolean(v?.trim());
}

/** Resposta alinhada ao bloco .env (Admin JWT, API interna, Pix, WhatsApp, regras). Segredos nunca são expostos. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const nextauth = process.env.NEXTAUTH_SECRET?.trim() ?? "";
  const jwt = process.env.JWT_SECRET?.trim() ?? "";
  const mpToken =
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || process.env.MP_ACCESS_TOKEN?.trim() || "";
  const mpWh =
    process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || process.env.MP_WEBHOOK_SECRET?.trim() || "";

  return NextResponse.json({
    pixProvider: process.env.PIX_PROVIDER ?? "mock",
    whatsappProvider: process.env.WHATSAPP_PROVIDER ?? "console",
    appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
    nextauthUrl: process.env.NEXTAUTH_URL ?? "",
    reservaExpiraMinutosPadrao: getDefaultReservationExpirationMinutes(),
    rankingCacheTtlSeconds: getRankingCacheTtlSeconds(),
    recentPurchasesWindowMinutes: getRecentPurchasesWindowMinutes(),

    auth: {
      nextauthSecretConfigured: nextauth.length > 0,
      jwtSecretConfigured: jwt.length > 0,
      /** Middleware do admin aceita JWT se pelo menos um segredo tiver ≥16 caracteres. */
      adminJwtReady: nextauth.length >= 16 || jwt.length >= 16,
    },
    internal: {
      internalApiKeyConfigured: set(process.env.INTERNAL_API_KEY),
      cronSecretConfigured: set(process.env.CRON_SECRET),
    },
    pix: {
      mercadoPagoAccessTokenConfigured: mpToken.length > 0,
      mercadoPagoWebhookSecretConfigured: mpWh.length > 0,
      legacyMpAccessTokenAlias: set(process.env.MP_ACCESS_TOKEN) && !set(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      legacyMpWebhookSecretAlias: set(process.env.MP_WEBHOOK_SECRET) && !set(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
    },
    whatsapp: {
      tokenConfigured: set(process.env.WHATSAPP_TOKEN),
      metaPhoneIdConfigured: set(process.env.WHATSAPP_META_PHONE_ID),
      instanceUrl: process.env.WHATSAPP_INSTANCE_URL?.trim() ?? "",
      webhookSecretConfigured: set(process.env.WHATSAPP_WEBHOOK_SECRET),
    },
  });
}
