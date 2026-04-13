import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { PixProvider } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-api";
import { resetPixProviderCache } from "@repo/payments";

const bodySchema = z.object({
  pixProviderMode: z.enum(["inherit", "mock", "mercadopago"]),
  mercadoPagoAccessToken: z.string().optional(),
  mercadoPagoWebhookSecret: z.string().optional(),
  /** Se true, remove o token da BD e volta a usar só o .env (ignora mercadoPagoAccessToken). */
  clearMercadoPagoAccessToken: z.boolean().optional(),
  clearMercadoPagoWebhookSecret: z.boolean().optional(),
});

/**
 * Guarda credenciais Pix (Mercado Pago) na base de dados. Valores vazios no painel herdam do .env.
 * Omissão de mercadoPagoAccessToken / mercadoPagoWebhookSecret = não alterar esse campo.
 * clear* = true força remoção na BD sem editar o campo no formulário.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const pixProviderOverride =
    body.pixProviderMode === "inherit"
      ? null
      : body.pixProviderMode === "mercadopago"
        ? PixProvider.MERCADOPAGO
        : PixProvider.MOCK;

  const tokenIn = body.mercadoPagoAccessToken;
  const whIn = body.mercadoPagoWebhookSecret;

  let mercadoPagoAccessToken: string | null | undefined;
  if (body.clearMercadoPagoAccessToken) {
    mercadoPagoAccessToken = null;
  } else if (tokenIn !== undefined) {
    mercadoPagoAccessToken = tokenIn.trim() === "" ? null : tokenIn.trim();
  } else {
    mercadoPagoAccessToken = undefined;
  }

  let mercadoPagoWebhookSecret: string | null | undefined;
  if (body.clearMercadoPagoWebhookSecret) {
    mercadoPagoWebhookSecret = null;
  } else if (whIn !== undefined) {
    mercadoPagoWebhookSecret = whIn.trim() === "" ? null : whIn.trim();
  } else {
    mercadoPagoWebhookSecret = undefined;
  }

  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      pixProviderOverride,
      mercadoPagoAccessToken: mercadoPagoAccessToken ?? null,
      mercadoPagoWebhookSecret: mercadoPagoWebhookSecret ?? null,
    },
    update: {
      pixProviderOverride,
      ...(mercadoPagoAccessToken !== undefined ? { mercadoPagoAccessToken } : {}),
      ...(mercadoPagoWebhookSecret !== undefined ? { mercadoPagoWebhookSecret } : {}),
    },
  });

  resetPixProviderCache();
  return NextResponse.json({ ok: true });
}
