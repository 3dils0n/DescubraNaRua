import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import {
  NumberSelectionMode,
  RaffleStatus,
} from "@prisma/client";
import { z } from "zod";
import { parsePagination } from "@/lib/admin-query";
import { slugify } from "@/lib/slug";
import { generateRaffleNumbers } from "@/lib/raffle-numbers";

const createSchema = z.object({
  titulo: z.string().min(2),
  descricao: z.string().min(1),
  premio: z.string().min(1),
  imagem: z.string().url().optional().nullable(),
  regulamento: z.string().min(1),
  valorNumero: z.number().positive(),
  quantidadeTotal: z.number().int().min(1).max(500_000),
  numeroPadding: z.number().int().min(1).max(8).default(4),
  dataSorteio: z.string().datetime(),
  modoSelecaoNumeros: z.enum(["MANUAL", "RANDOM", "MIXED"]),
  quantidadeMinimaCompra: z.number().int().min(1),
  quantidadeMaximaCompra: z.number().int().min(1),
  multiploCompra: z.number().int().positive().optional().nullable(),
  reservaExpiraMinutos: z.number().int().min(5).max(1440).default(20),
  exibirRankingPublico: z.boolean().optional(),
  anonimizarRankingPublico: z.boolean().optional(),
  tamanhoRankingPublico: z.number().int().min(1).max(100).optional(),
  ativarFeedCompras: z.boolean().optional(),
  ativarContadorTempoReal: z.boolean().optional(),
  ativarWhatsapp: z.boolean().optional(),
  mensagemWhatsappPadrao: z.string().optional().nullable(),
  checkoutPedirEmail: z.boolean().optional(),
  checkoutPedirCpf: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "DRAWN"]).optional(),
  slug: z.string().min(2).optional(),
});

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { skip, take, page } = parsePagination(searchParams);

  const [total, rows] = await Promise.all([
    prisma.raffle.count(),
    prisma.raffle.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            numbers: true,
            reservations: true,
          },
        },
      },
    }),
  ]);

  const raffleIds = rows.map((r) => r.id);
  const grouped =
    raffleIds.length === 0
      ? []
      : await prisma.raffleNumber.groupBy({
          by: ["raffleId", "status"],
          where: { raffleId: { in: raffleIds } },
          _count: { id: true },
        });
  const byRaffle = new Map<string, Record<string, number>>();
  for (const g of grouped) {
    const m = byRaffle.get(g.raffleId) ?? {};
    m[g.status] = g._count.id;
    byRaffle.set(g.raffleId, m);
  }

  const withSold = rows.map((r) => {
    const st = byRaffle.get(r.id) ?? {};
    const sold = st.PAID ?? 0;
    const reserved = st.RESERVED ?? 0;
    const available = st.AVAILABLE ?? 0;
    const blocked = st.BLOCKED ?? 0;
    return {
      ...r,
      valorNumero: Number(r.valorNumero),
      sold,
      reserved,
      available,
      blocked,
    };
  });

  return NextResponse.json({ page, pageSize: take, total, items: withSold });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = createSchema.parse(await req.json());
  const baseSlug = body.slug ?? slugify(body.titulo);
  let slug = baseSlug;
  let n = 0;
  while (await prisma.raffle.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const raffle = await prisma.raffle.create({
    data: {
      slug,
      titulo: body.titulo,
      descricao: body.descricao,
      premio: body.premio,
      imagem: body.imagem ?? null,
      regulamento: body.regulamento,
      valorNumero: body.valorNumero,
      quantidadeTotal: body.quantidadeTotal,
      numeroPadding: body.numeroPadding,
      dataSorteio: new Date(body.dataSorteio),
      modoSelecaoNumeros: body.modoSelecaoNumeros as NumberSelectionMode,
      quantidadeMinimaCompra: body.quantidadeMinimaCompra,
      quantidadeMaximaCompra: body.quantidadeMaximaCompra,
      multiploCompra: body.multiploCompra ?? null,
      reservaExpiraMinutos: body.reservaExpiraMinutos,
      exibirRankingPublico: body.exibirRankingPublico ?? true,
      anonimizarRankingPublico: body.anonimizarRankingPublico ?? true,
      tamanhoRankingPublico: body.tamanhoRankingPublico ?? 10,
      ativarFeedCompras: body.ativarFeedCompras ?? true,
      ativarContadorTempoReal: body.ativarContadorTempoReal ?? true,
      ativarWhatsapp: body.ativarWhatsapp ?? true,
      mensagemWhatsappPadrao: body.mensagemWhatsappPadrao ?? null,
      checkoutPedirEmail: body.checkoutPedirEmail ?? false,
      checkoutPedirCpf: body.checkoutPedirCpf ?? false,
      status: (body.status as RaffleStatus) ?? RaffleStatus.DRAFT,
    },
  });

  await generateRaffleNumbers(raffle.id, body.quantidadeTotal, body.numeroPadding);

  return NextResponse.json({ id: raffle.id, slug: raffle.slug });
}
