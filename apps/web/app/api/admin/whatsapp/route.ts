import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { Prisma, WhatsAppSendStatus } from "@prisma/client";
import { parsePagination } from "@/lib/admin-query";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusEnvio = searchParams.get("statusEnvio") as WhatsAppSendStatus | null;
  const raffleId = searchParams.get("raffleId") ?? undefined;
  const nome = searchParams.get("nome")?.trim();
  const { skip, take, page } = parsePagination(searchParams);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(statusEnvio && Object.values(WhatsAppSendStatus).includes(statusEnvio) ? { statusEnvio } : {}),
    ...(raffleId ? { reservation: { raffleId } } : {}),
    ...(nome ? { participant: { nome: { contains: nome, mode: Prisma.QueryMode.insensitive } } } : {}),
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
    prisma.whatsAppMessage.count({ where }),
    prisma.whatsAppMessage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        reservation: { select: { codigo: true, raffle: { select: { titulo: true } } } },
        participant: { select: { nome: true, telefone: true } },
      },
    }),
  ]);

  return NextResponse.json({ page, pageSize: take, total, items });
}
