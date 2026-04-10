import { NextResponse } from "next/server";
import { getEnv } from "@repo/shared";
import { prisma } from "@repo/db";
import { applyApprovedPaymentByExternalPaymentId } from "@repo/payments";

type Params = { params: Promise<{ pixId: string }> };

/** Somente com PIX_PROVIDER=mock — simula pagamento aprovado para testes locais */
export async function POST(_req: Request, ctx: Params) {
  if (getEnv().PIX_PROVIDER !== "mock") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { pixId } = await ctx.params;
  const pix = await prisma.pixPayment.findUnique({ where: { id: pixId } });
  if (!pix?.externalPaymentId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await applyApprovedPaymentByExternalPaymentId(pix.externalPaymentId);
  return NextResponse.json({ ok: true });
}
