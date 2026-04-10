import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ id: admin.id, email: admin.email });
}
