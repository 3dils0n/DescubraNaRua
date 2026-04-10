import { NextResponse } from "next/server";
import { syncPaymentStatusFromGateway } from "@repo/payments";

type Params = { params: Promise<{ pixId: string }> };

export async function POST(_req: Request, ctx: Params) {
  const { pixId } = await ctx.params;
  await syncPaymentStatusFromGateway(pixId);
  return NextResponse.json({ ok: true });
}
