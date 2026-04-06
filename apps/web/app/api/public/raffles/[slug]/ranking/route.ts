import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getBuyerRanking } from "@repo/shared/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { slug } = await ctx.params;
  const raffle = await prisma.raffle.findUnique({ where: { slug } });
  if (!raffle) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!raffle.exibirRankingPublico) return NextResponse.json({ ranking: [] });

  const ranking = await getBuyerRanking(
    raffle.id,
    raffle.tamanhoRankingPublico,
    raffle.anonimizarRankingPublico,
  );
  return NextResponse.json({ ranking });
}
