import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { parsePagination } from "@/lib/admin-query";
import {
  PixInternalStatus,
  Prisma,
  ReservationStatus,
  WebhookInboxStatus,
  WhatsAppSendStatus,
} from "@prisma/client";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { skip, take, page } = parsePagination(searchParams);
  const context = searchParams.get("context")?.trim();

  const where = context ? { context: { contains: context, mode: Prisma.QueryMode.insensitive } } : {};

  const [total, items, health] = await Promise.all([
    prisma.integrationLog.count({ where }),
    prisma.integrationLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.webhookInbox.count({ where: { status: WebhookInboxStatus.FAILED } }),
      prisma.whatsAppMessage.count({ where: { statusEnvio: WhatsAppSendStatus.FAILED } }),
      prisma.pixPayment.count({
        where: {
          statusInterno: PixInternalStatus.APPROVED,
          reservation: { status: { not: ReservationStatus.PAID } },
        },
      }),
      prisma.reservation.count({
        where: { status: ReservationStatus.EXPIRED },
      }),
    ]),
  ]);

  return NextResponse.json({
    page,
    pageSize: take,
    total,
    items,
    health: {
      webhooksFailed: health[0],
      whatsappFailed: health[1],
      pixInconsistent: health[2],
      reservationsExpired: health[3],
    },
  });
}
