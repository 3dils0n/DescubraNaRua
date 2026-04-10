import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { expirePendingReservations, getRafflePublicStats } from "@repo/shared/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { slug } = await ctx.params;
  const r = await prisma.raffle.findUnique({ where: { slug }, select: { id: true } });
  if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await expirePendingReservations();
  const stats = await getRafflePublicStats(r.id);
  return NextResponse.json(stats);
}
