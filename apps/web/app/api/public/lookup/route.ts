import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { z } from "zod";

const schema = z.object({
  codigo: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
}).refine((d) => d.codigo || d.telefone || d.email, { message: "Informe código, telefone ou email" });

type LookupRow = {
  id: string;
  codigo: string;
  status: string;
  raffle: { titulo: string; slug: string };
};

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  let list: LookupRow[] = [];

  if (body.codigo) {
    const r = await prisma.reservation.findMany({
      where: { codigo: body.codigo.trim().toUpperCase() },
      select: { id: true, codigo: true, status: true, raffle: { select: { titulo: true, slug: true } } },
    });
    list = r;
  } else if (body.telefone) {
    const digits = body.telefone.replace(/\D/g, "");
    const p = await prisma.participant.findMany({
      where: { telefone: { contains: digits } },
      select: { id: true },
    });
    list = await prisma.reservation.findMany({
      where: { participantId: { in: p.map((x) => x.id) } },
      select: { id: true, codigo: true, status: true, raffle: { select: { titulo: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } else if (body.email) {
    const p = await prisma.participant.findMany({
      where: { email: body.email.toLowerCase() },
      select: { id: true },
    });
    list = await prisma.reservation.findMany({
      where: { participantId: { in: p.map((x) => x.id) } },
      select: { id: true, codigo: true, status: true, raffle: { select: { titulo: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } else {
    list = [];
  }

  return NextResponse.json({ reservations: list });
}
