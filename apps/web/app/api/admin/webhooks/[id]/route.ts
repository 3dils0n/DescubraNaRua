import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { prisma } from "@repo/db";
import { WebhookInboxStatus } from "@prisma/client";
import { applyApprovedPaymentByExternalPaymentId } from "@repo/payments";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const row = await prisma.webhookInbox.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(row);
}

export async function POST(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  const row = await prisma.webhookInbox.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (action === "requeue") {
    await prisma.webhookInbox.update({
      where: { id },
      data: {
        status: WebhookInboxStatus.PENDING,
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        processedAt: null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reprocess_now" && row.resourceId) {
    await applyApprovedPaymentByExternalPaymentId(row.resourceId);
    await prisma.webhookInbox.update({
      where: { id },
      data: {
        status: WebhookInboxStatus.COMPLETED,
        processedAt: new Date(),
        lastError: null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_ignored") {
    await prisma.webhookInbox.update({
      where: { id },
      data: {
        status: WebhookInboxStatus.COMPLETED,
        processedAt: new Date(),
        lastError: "Ignorado manualmente (admin)",
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "BAD_ACTION" }, { status: 400 });
}
