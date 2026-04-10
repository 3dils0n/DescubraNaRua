import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { RaffleStatus } from "@prisma/client";

export async function GET() {
  const list = await prisma.raffle.findMany({
    where: { status: RaffleStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      titulo: true,
      descricao: true,
      premio: true,
      imagem: true,
      valorNumero: true,
      quantidadeTotal: true,
      dataSorteio: true,
    },
  });

  const withCounts = await Promise.all(
    list.map(async (r) => {
      const [paid, total] = await Promise.all([
        prisma.raffleNumber.count({ where: { raffleId: r.id, status: "PAID" } }),
        prisma.raffleNumber.count({ where: { raffleId: r.id } }),
      ]);
      return {
        ...r,
        valorNumero: Number(r.valorNumero),
        sold: paid,
        totalNumbers: total,
        percent: total ? Math.round((paid / total) * 1000) / 10 : 0,
      };
    }),
  );

  return NextResponse.json({ raffles: withCounts });
}
