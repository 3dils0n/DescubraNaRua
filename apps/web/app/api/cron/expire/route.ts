import { NextResponse } from "next/server";
import { expirePendingReservations } from "@repo/shared/server";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const r = await expirePendingReservations();
  return NextResponse.json(r);
}
