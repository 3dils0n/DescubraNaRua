import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  return NextResponse.json({
    pixProvider: process.env.PIX_PROVIDER ?? "mock",
    whatsappProvider: process.env.WHATSAPP_PROVIDER ?? "console",
    appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
    reservaExpiraMinutosPadrao: 20,
  });
}
