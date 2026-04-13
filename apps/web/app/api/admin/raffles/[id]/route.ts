import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { RaffleStatus, RaffleNumberStatus, NumberSelectionMode } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  titulo: z.string().min(2).optional(),
  descricao: z.string().optional(),
  premio: z.string().optional(),
  imagem: z.string().url().nullable().optional(),
  regulamento: z.string().optional(),
  valorNumero: z.number().positive().optional(),
  dataSorteio: z.string().datetime().optional(),
  modoSelecaoNumeros: z.enum(["MANUAL", "RANDOM", "MIXED"]).optional(),
  quantidadeMinimaCompra: z.number().int().optional(),
  quantidadeMaximaCompra: z.number().int().optional(),
  multiploCompra: z.number().int().positive().nullable().optional(),
  reservaExpiraMinutos: z.number().int().optional(),
  exibirRankingPublico: z.boolean().optional(),
  anonimizarRankingPublico: z.boolean().optional(),
  tamanhoRankingPublico: z.number().int().optional(),
  ativarFeedCompras: z.boolean().optional(),
  ativarContadorTempoReal: z.boolean().optional(),
  ativarWhatsapp: z.boolean().optional(),
  mensagemWhatsappPadrao: z.string().nullable().optional(),
  checkoutPedirEmail: z.boolean().optional(),
  checkoutPedirCpf: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "DRAWN"]).optional(),
  numeroVencedorId: z.string().nullable().optional(),
  sorteadoEm: z.string().datetime().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await prisma.raffle.findUnique({
    where: { id },
    include: {
      numeroVencedor: true,
      _count: { select: { numbers: true, reservations: true } },
    },
  });
  if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({
    ...r,
    valorNumero: Number(r.valorNumero),
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const body = patchSchema.parse(await req.json());

  const existing = await prisma.raffle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (body.numeroVencedorId) {
    const num = await prisma.raffleNumber.findFirst({
      where: { id: body.numeroVencedorId, raffleId: id },
    });
    if (!num) return NextResponse.json({ error: "NUMERO_INVALIDO" }, { status: 400 });
    if (num.status !== RaffleNumberStatus.PAID) {
      return NextResponse.json({ error: "NUMERO_DEVE_ESTAR_PAGO" }, { status: 400 });
    }
  }

  const updated = await prisma.raffle.update({
    where: { id },
    data: {
      titulo: body.titulo,
      descricao: body.descricao,
      premio: body.premio,
      imagem: body.imagem,
      regulamento: body.regulamento,
      valorNumero: body.valorNumero,
      dataSorteio: body.dataSorteio ? new Date(body.dataSorteio) : undefined,
      modoSelecaoNumeros: body.modoSelecaoNumeros as NumberSelectionMode | undefined,
      quantidadeMinimaCompra: body.quantidadeMinimaCompra,
      quantidadeMaximaCompra: body.quantidadeMaximaCompra,
      multiploCompra: body.multiploCompra,
      reservaExpiraMinutos: body.reservaExpiraMinutos,
      exibirRankingPublico: body.exibirRankingPublico,
      anonimizarRankingPublico: body.anonimizarRankingPublico,
      tamanhoRankingPublico: body.tamanhoRankingPublico,
      ativarFeedCompras: body.ativarFeedCompras,
      ativarContadorTempoReal: body.ativarContadorTempoReal,
      ativarWhatsapp: body.ativarWhatsapp,
      mensagemWhatsappPadrao: body.mensagemWhatsappPadrao,
      checkoutPedirEmail: body.checkoutPedirEmail,
      checkoutPedirCpf: body.checkoutPedirCpf,
      status: body.status as RaffleStatus | undefined,
      numeroVencedorId: body.numeroVencedorId,
      sorteadoEm: body.sorteadoEm === undefined ? undefined : body.sorteadoEm ? new Date(body.sorteadoEm) : null,
    },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await prisma.raffle.findUnique({
    where: { id },
    include: { _count: { select: { reservations: true } } },
  });
  if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (r.status !== RaffleStatus.DRAFT) {
    return NextResponse.json({ error: "APENAS_RASCUNHO" }, { status: 400 });
  }
  if (r._count.reservations > 0) {
    return NextResponse.json({ error: "TEM_RESERVAS" }, { status: 400 });
  }
  await prisma.raffle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
