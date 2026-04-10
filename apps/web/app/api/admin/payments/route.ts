import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { PixInternalStatus, Prisma } from "@prisma/client";
import { parsePagination } from "@/lib/admin-query";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusInterno = searchParams.get("statusInterno") as PixInternalStatus | null;
  const statusGateway = searchParams.get("statusGateway")?.trim();
  const codigo = searchParams.get("codigo")?.trim();
  const txid = searchParams.get("txid")?.trim();
  const extId = searchParams.get("externalPaymentId")?.trim();
  const reservationId = searchParams.get("reservationId")?.trim();
  const { skip, take, page } = parsePagination(searchParams);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(reservationId ? { reservationId } : {}),
    ...(statusInterno && Object.values(PixInternalStatus).includes(statusInterno) ? { statusInterno } : {}),
    ...(statusGateway ? { statusGateway: { contains: statusGateway, mode: Prisma.QueryMode.insensitive } } : {}),
    ...(txid ? { OR: [{ txid: { contains: txid } }, { externalPaymentId: { contains: txid } }] } : {}),
    ...(extId ? { externalPaymentId: { contains: extId } } : {}),
    ...(codigo
      ? { reservation: { codigo: { contains: codigo, mode: Prisma.QueryMode.insensitive } } }
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
    prisma.pixPayment.count({ where }),
    prisma.pixPayment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        reservation: {
          include: {
            participant: { select: { nome: true, telefone: true, email: true } },
            raffle: { select: { titulo: true, slug: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize: take,
    total,
    items: items.map((p) => ({
      ...p,
      valor: Number(p.valor),
    })),
  });
}
