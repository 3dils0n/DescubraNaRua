import { prisma } from "@repo/db";
import { RaffleNumberStatus } from "@prisma/client";

/** Cria todos os números da rifa em lotes (createMany). */
export async function generateRaffleNumbers(
  raffleId: string,
  quantidadeTotal: number,
  numeroPadding: number,
): Promise<void> {
  const batchSize = 500;
  for (let start = 1; start <= quantidadeTotal; start += batchSize) {
    const end = Math.min(start + batchSize - 1, quantidadeTotal);
    const nums: { raffleId: string; numero: string; status: RaffleNumberStatus }[] = [];
    for (let n = start; n <= end; n++) {
      nums.push({
        raffleId,
        numero: String(n).padStart(numeroPadding, "0"),
        status: RaffleNumberStatus.AVAILABLE,
      });
    }
    await prisma.raffleNumber.createMany({ data: nums });
  }
}
