import { prisma } from "@repo/db";
import { generateExternalReference, generateReservationCode, getPublicAppUrl } from "@repo/shared";
import {
  PixInternalStatus,
  PixProvider,
  Prisma,
  RaffleNumberStatus,
  RaffleStatus,
  ReservationStatus,
} from "@prisma/client";
import { z } from "zod";
import { getPixProvider } from "./factory";

const checkoutSchema = z.object({
  raffleSlug: z.string().min(1),
  nome: z.string().min(2).max(120),
  telefone: z.string().min(10).max(20),
  email: z.string().optional(),
  cpf: z.string().optional(),
  aceitouTermos: z.literal(true),
  quantity: z.number().int().positive().optional(),
  numberIds: z.array(z.string()).optional(),
});

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** E-mail técnico para o gateway Pix quando o comprador não informa e-mail (rifa sem pedido de e-mail). */
export function syntheticEmailForPix(telefone: string): string {
  const d = telefone.replace(/\D/g, "") || "0";
  return `cliente+${d}@sem-email.rifa`;
}

export type CheckoutInput = z.infer<typeof checkoutSchema>;

function validateQuantityRules(
  qty: number,
  min: number,
  max: number,
  multiplo: number | null,
): string | null {
  if (qty < min) return `Quantidade mínima é ${min}`;
  if (qty > max) return `Quantidade máxima é ${max}`;
  if (multiplo && multiplo > 1 && qty % multiplo !== 0) return `Quantidade deve ser múltiplo de ${multiplo}`;
  return null;
}

export async function createReservationWithPix(input: CheckoutInput) {
  const data = checkoutSchema.parse(input);

  const raffle = await prisma.raffle.findUnique({
    where: { slug: data.raffleSlug },
  });
  if (!raffle || raffle.status !== RaffleStatus.ACTIVE) {
    throw new Error("RIFA_INDISPONIVEL");
  }

  let quantity: number;
  let pickedIds: string[];

  const mode = raffle.modoSelecaoNumeros;

  if (mode === "MANUAL") {
    if (!data.numberIds?.length) throw new Error("NUMEROS_OBRIGATORIOS");
    quantity = data.numberIds.length;
    const err = validateQuantityRules(
      quantity,
      raffle.quantidadeMinimaCompra,
      raffle.quantidadeMaximaCompra,
      raffle.multiploCompra,
    );
    if (err) throw new Error(err);
    pickedIds = data.numberIds;
  } else if (mode === "RANDOM") {
    quantity = data.quantity ?? 0;
    const err = validateQuantityRules(
      quantity,
      raffle.quantidadeMinimaCompra,
      raffle.quantidadeMaximaCompra,
      raffle.multiploCompra,
    );
    if (err) throw new Error(err);
    pickedIds = await pickRandomAvailable(raffle.id, quantity);
  } else {
    if (data.numberIds?.length) {
      quantity = data.numberIds.length;
      const err = validateQuantityRules(
        quantity,
        raffle.quantidadeMinimaCompra,
        raffle.quantidadeMaximaCompra,
        raffle.multiploCompra,
      );
      if (err) throw new Error(err);
      pickedIds = data.numberIds;
    } else if (data.quantity) {
      quantity = data.quantity;
      const err = validateQuantityRules(
        quantity,
        raffle.quantidadeMinimaCompra,
        raffle.quantidadeMaximaCompra,
        raffle.multiploCompra,
      );
      if (err) throw new Error(err);
      pickedIds = await pickRandomAvailable(raffle.id, quantity);
    } else {
      throw new Error("NUMEROS_OBRIGATORIOS");
    }
  }

  const emailTrim = (data.email ?? "").trim();
  if (emailTrim && !isValidEmail(emailTrim)) {
    throw new Error("EMAIL_INVALIDO");
  }
  if (raffle.checkoutPedirEmail && !emailTrim) {
    throw new Error("EMAIL_OBRIGATORIO");
  }
  const cpfDigits = data.cpf?.replace(/\D/g, "") ?? "";
  if (raffle.checkoutPedirCpf && cpfDigits.length !== 11) {
    throw new Error("CPF_OBRIGATORIO");
  }

  const effectiveEmail = emailTrim || syntheticEmailForPix(data.telefone);

  const valorUnit = Number(raffle.valorNumero);
  const valorTotal = valorUnit * quantity;
  const expiresAt = new Date(Date.now() + raffle.reservaExpiraMinutos * 60 * 1000);
  const codigo = generateReservationCode();
  const externalRef = generateExternalReference("pix");

  const base = getPublicAppUrl();
  const pixProvider = getPixProvider();
  const notificationUrl = `${base}/api/webhooks/mercadopago`;

  const [nomeParts, ...rest] = data.nome.trim().split(/\s+/);
  const firstName = nomeParts ?? "Participante";
  const lastName = rest.length ? rest.join(" ") : " ";

  const result = await prisma.$transaction(async (tx) => {
    const available = await tx.raffleNumber.count({
      where: { raffleId: raffle.id, status: RaffleNumberStatus.AVAILABLE, id: { in: pickedIds } },
    });
    if (available !== pickedIds.length) {
      throw new Error("NUMEROS_INDISPONIVEIS");
    }

    const locked = await tx.raffleNumber.updateMany({
      where: { id: { in: pickedIds }, status: RaffleNumberStatus.AVAILABLE },
      data: { status: RaffleNumberStatus.RESERVED },
    });
    if (locked.count !== pickedIds.length) {
      throw new Error("CONCORRENCIA_NUMEROS");
    }

    const participant = await tx.participant.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        email: effectiveEmail,
        cpf: cpfDigits || null,
        aceitouTermos: true,
      },
    });

    const reservation = await tx.reservation.create({
      data: {
        codigo,
        raffleId: raffle.id,
        participantId: participant.id,
        status: ReservationStatus.PENDING,
        quantidade: quantity,
        valorTotal: new Prisma.Decimal(valorTotal),
        expiresAt,
        numbers: {
          create: pickedIds.map((id) => ({ raffleNumberId: id })),
        },
      },
    });

    const pixResult = await pixProvider.createPixPayment({
      amount: valorTotal,
      description: `${raffle.titulo} — ${quantity} números`,
      externalReference: externalRef,
      payerEmail: effectiveEmail,
      payerFirstName: firstName,
      payerLastName: lastName,
      payerCpf: cpfDigits ? data.cpf : undefined,
      notificationUrl,
      idempotencyKey: reservation.id,
    });

    const providerEnum =
      pixResult.provider === "MERCADOPAGO" ? PixProvider.MERCADOPAGO : PixProvider.MOCK;

    const pixRow = await tx.pixPayment.create({
      data: {
        reservationId: reservation.id,
        provider: providerEnum,
        externalPaymentId: pixResult.externalPaymentId,
        externalReference: pixResult.externalReference,
        txid: pixResult.txid,
        statusInterno: PixInternalStatus.PENDING,
        statusGateway: pixResult.statusGateway,
        valor: new Prisma.Decimal(valorTotal),
        qrCodeText: pixResult.qrCodeText,
        qrCodeBase64: pixResult.qrCodeBase64,
        pixCopiaECola: pixResult.pixCopiaECola,
        expiresAt: pixResult.expiresAt,
        idempotencyKey: reservation.id,
        rawResponseJson: pixResult.raw as object,
      },
    });

    return { reservation, participant, pixRow, pixResult };
  });

  return result;
}

async function pickRandomAvailable(raffleId: string, qty: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM numeros_rifa
    WHERE rifa_id = ${raffleId}
      AND status = 'AVAILABLE'
    ORDER BY random()
    LIMIT ${qty}
  `;
  if (rows.length !== qty) {
    throw new Error("ESTOQUE_INSUFICIENTE");
  }
  return rows.map((r) => r.id);
}
