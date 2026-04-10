import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { RaffleNumberStatus } from "@prisma/client";
import { parsePagination } from "@/lib/admin-query";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raffleId = searchParams.get("raffleId") ?? undefined;
  const status = searchParams.get("status") as RaffleNumberStatus | null;
  const q = searchParams.get("q")?.trim() ?? "";
  const { skip, take, page } = parsePagination(searchParams);

  if (!raffleId) return NextResponse.json({ error: "RAFFLE_ID_OBRIGATORIO" }, { status: 400 });

  const where = {
    raffleId,
    ...(status && Object.values(RaffleNumberStatus).includes(status) ? { status } : {}),
    ...(q ? { numero: { contains: q } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.raffleNumber.count({ where }),
    prisma.raffleNumber.findMany({
      where,
      skip,
      take,
      orderBy: { numero: "asc" },
      include: {
        reservationNums: {
          take: 1,
          include: {
            reservation: {
              select: {
                id: true,
                codigo: true,
                status: true,
                participant: { select: { nome: true, telefone: true, email: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ page, pageSize: take, total, items });
}
