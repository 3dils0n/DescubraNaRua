import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { PixProvider, Prisma, WebhookInboxStatus } from "@prisma/client";
import { parsePagination } from "@/lib/admin-query";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as WebhookInboxStatus | null;
  const topic = searchParams.get("topic")?.trim();
  const provider = searchParams.get("provider") as PixProvider | null;
  const resourceId = searchParams.get("resourceId")?.trim();
  const { skip, take, page } = parsePagination(searchParams);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(status && Object.values(WebhookInboxStatus).includes(status) ? { status } : {}),
    ...(topic ? { topic: { contains: topic, mode: Prisma.QueryMode.insensitive } } : {}),
    ...(provider && Object.values(PixProvider).includes(provider) ? { provider } : {}),
    ...(resourceId ? { resourceId: { contains: resourceId } } : {}),
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
    prisma.webhookInbox.count({ where }),
    prisma.webhookInbox.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ page, pageSize: take, total, items });
}
