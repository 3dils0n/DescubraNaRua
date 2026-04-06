import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  INTERNAL_API_KEY: z.string().optional(),
  PIX_PROVIDER: z.enum(["mercadopago", "mock"]).default("mock"),
  MP_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  WHATSAPP_PROVIDER: z.enum(["console", "meta", "zapi", "evolution", "mock"]).default("console"),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_META_PHONE_ID: z.string().optional(),
  WHATSAPP_INSTANCE_URL: z.string().optional(),
  WHATSAPP_WEBHOOK_SECRET: z.string().optional(),
  RESERVATION_EXPIRATION_MINUTES: z.coerce.number().optional(),
  RANKING_CACHE_TTL_SECONDS: z.coerce.number().optional(),
  RECENT_PURCHASES_WINDOW_MINUTES: z.coerce.number().optional(),
  CRON_SECRET: z.string().optional(),
});

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Variáveis de ambiente inválidas: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  cached = parsed.data;
  return cached;
}

export function getPublicAppUrl(): string {
  const e = getEnv();
  const raw =
    e.APP_BASE_URL?.replace(/\/$/, "") ||
    e.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    e.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "";
  return raw || "http://localhost:3000";
}

export function getJwtSecret(): string {
  const e = getEnv();
  return e.NEXTAUTH_SECRET || e.JWT_SECRET || "dev-secret-change-in-prod-16";
}

export function getMercadoPagoAccessToken(): string | undefined {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
}

export function getMercadoPagoWebhookSecret(): string | undefined {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET;
}
