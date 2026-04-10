import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { Prisma, ReservationStatus } from "@prisma/client";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raffleId = searchParams.get("raffleId") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q")?.trim();

  const paidRes = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.PAID,
      ...(raffleId ? { raffleId } : {}),
      ...(q
        ? {
            participant: {
              OR: [
                { nome: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { telefone: { contains: q } },
              ],
            },
          }
        : {}),
      ...(from || to
        ? {
            paidAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    select: {
      participantId: true,
      valorTotal: true,
      raffleId: true,
      numbers: { select: { id: true } },
      participant: { select: { nome: true, telefone: true, email: true } },
      raffle: { select: { titulo: true, slug: true } },
    },
  });

  const map = new Map<
    string,
    {
      participantId: string;
      nome: string;
      telefone: string;
      email: string;
      qty: number;
      spent: number;
      raffles: Set<string>;
    }
  >();

  for (const r of paidRes) {
    const key = raffleId ? r.participantId : r.participantId;
    const cur = map.get(key) ?? {
      participantId: r.participantId,
      nome: r.participant.nome,
      telefone: r.participant.telefone,
      email: r.participant.email,
      qty: 0,
      spent: 0,
      raffles: new Set<string>(),
    };
    cur.spent += Number(r.valorTotal);
    cur.qty += r.numbers.length;
    cur.raffles.add(r.raffle.titulo);
    map.set(key, cur);
  }

  const rows = [...map.values()]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, limit)
    .map((r, i) => ({
      position: i + 1,
      nome: r.nome,
      telefone: r.telefone,
      email: r.email,
      quantidadeNumeros: r.qty,
      valorTotal: r.spent,
      rifas: [...r.raffles].join(", "),
    }));

  return NextResponse.json({ items: rows });
}
