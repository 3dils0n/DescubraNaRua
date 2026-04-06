import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { RaffleStatus } from "@prisma/client";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { slug } = await ctx.params;
  const r = await prisma.raffle.findUnique({
    where: { slug },
  });
  if (!r || r.status !== RaffleStatus.ACTIVE) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const [paid, total] = await Promise.all([
    prisma.raffleNumber.count({ where: { raffleId: r.id, status: "PAID" } }),
    prisma.raffleNumber.count({ where: { raffleId: r.id } }),
  ]);

  return NextResponse.json({
    raffle: {
      ...r,
      valorNumero: Number(r.valorNumero),
      sold: paid,
      totalNumbers: total,
      percent: total ? Math.round((paid / total) * 1000) / 10 : 0,
    },
  });
}
