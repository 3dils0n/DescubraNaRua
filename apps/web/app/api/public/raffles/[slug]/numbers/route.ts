import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Params) {
  const { slug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
  const take = Math.min(500, Math.max(1, parseInt(searchParams.get("take") ?? "200", 10)));

  const raffle = await prisma.raffle.findUnique({ where: { slug }, select: { id: true } });
  if (!raffle) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const [rows, total] = await Promise.all([
    prisma.raffleNumber.findMany({
      where: { raffleId: raffle.id },
      select: { id: true, numero: true, status: true },
      orderBy: { numero: "asc" },
      skip,
      take,
    }),
    prisma.raffleNumber.count({ where: { raffleId: raffle.id } }),
  ]);

  return NextResponse.json({ numbers: rows, total, skip, take });
}
