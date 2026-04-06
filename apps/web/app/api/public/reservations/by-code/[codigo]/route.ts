import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

type Params = { params: Promise<{ codigo: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { codigo } = await ctx.params;
  const res = await prisma.reservation.findUnique({
    where: { codigo: codigo.toUpperCase() },
    include: {
      raffle: true,
      participant: true,
      numbers: { include: { raffleNumber: true } },
      pixPayments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!res) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const pix = res.pixPayments[0];
  return NextResponse.json({
    codigo: res.codigo,
    status: res.status,
    quantidade: res.quantidade,
    valorTotal: Number(res.valorTotal),
    paidAt: res.paidAt,
    expiresAt: res.expiresAt,
    raffle: { titulo: res.raffle.titulo, slug: res.raffle.slug },
    participant: {
      nome: res.participant.nome,
      telefone: res.participant.telefone,
      email: res.participant.email,
    },
    numbers: res.numbers.map((n) => n.raffleNumber.numero).sort(),
    pix: pix
      ? {
          statusInterno: pix.statusInterno,
          statusGateway: pix.statusGateway,
          expiresAt: pix.expiresAt,
          paidAt: pix.paidAt,
        }
      : null,
  });
}
