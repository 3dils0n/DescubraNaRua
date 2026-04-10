import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { Prisma, ReservationStatus } from "@prisma/client";
import { parsePagination } from "@/lib/admin-query";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raffleId = searchParams.get("raffleId") ?? undefined;
  const status = searchParams.get("status") as ReservationStatus | null;
  const codigo = searchParams.get("codigo")?.trim();
  const nome = searchParams.get("nome")?.trim();
  const telefone = searchParams.get("telefone")?.trim();
  const email = searchParams.get("email")?.trim();
  const txid = searchParams.get("txid")?.trim();
  const { skip, take, page } = parsePagination(searchParams);

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(raffleId ? { raffleId } : {}),
    ...(status && Object.values(ReservationStatus).includes(status) ? { status } : {}),
    ...(codigo ? { codigo: { contains: codigo, mode: Prisma.QueryMode.insensitive } } : {}),
    ...(nome ? { participant: { nome: { contains: nome, mode: Prisma.QueryMode.insensitive } } } : {}),
    ...(telefone ? { participant: { telefone: { contains: telefone } } } : {}),
    ...(email ? { participant: { email: { contains: email, mode: Prisma.QueryMode.insensitive } } } : {}),
    ...(txid
      ? {
          pixPayments: { some: { OR: [{ txid: { contains: txid } }, { externalPaymentId: { contains: txid } }] } },
        }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        raffle: { select: { titulo: true, slug: true } },
        participant: true,
        pixPayments: { take: 1, orderBy: { createdAt: "desc" } },
        numbers: { include: { raffleNumber: { select: { numero: true, status: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize: take,
    total,
    items: items.map((r) => ({
      ...r,
      valorTotal: Number(r.valorTotal),
      pix: r.pixPayments?.[0] ?? null,
    })),
  });
}
