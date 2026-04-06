import { NextResponse } from "next/server";
import { rateLimit } from "@repo/shared";
import { createReservationWithPix } from "@repo/payments";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`checkout:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const result = await createReservationWithPix(body);
    return NextResponse.json({
      reservationId: result.reservation.id,
      codigo: result.reservation.codigo,
      pix: {
        id: result.pixRow.id,
        qrCodeBase64: result.pixResult.qrCodeBase64,
        pixCopiaECola: result.pixResult.pixCopiaECola,
        expiresAt: result.pixResult.expiresAt.toISOString(),
        externalPaymentId: result.pixResult.externalPaymentId,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERRO";
    const map: Record<string, number> = {
      RIFA_INDISPONIVEL: 400,
      NUMEROS_OBRIGATORIOS: 400,
      NUMEROS_INDISPONIVEIS: 409,
      CONCORRENCIA_NUMEROS: 409,
      ESTOQUE_INSUFICIENTE: 409,
    };
    const status = map[msg] ?? 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
