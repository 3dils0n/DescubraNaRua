import {
  PrismaClient,
  RaffleStatus,
  NumberSelectionMode,
  RaffleNumberStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("123456", 12);
  await prisma.admin.upsert({
    where: { email: "admin@rifa.com" },
    update: { passwordHash: hash },
    create: { email: "admin@rifa.com", passwordHash: hash },
  });

  const slug = "descubra-na-rua";
  const total = 1000;
  const padding = 4;

  const existing = await prisma.raffle.findUnique({ where: { slug } });
  if (existing) {
    console.log("Seed: rifa já existe, pulando criação.");
    return;
  }

  const raffle = await prisma.raffle.create({
    data: {
      slug,
      titulo: "Descubra na Rua",
      descricao:
        "A experiência que todo mundo quer viver. Prêmios incríveis, transparência total e confirmação automática via Pix.",
      premio: "Prêmio surpresa premium + experiência exclusiva",
      imagem: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
      valorNumero: 0.1,
      quantidadeTotal: total,
      numeroPadding: padding,
      dataSorteio: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      regulamento:
        "1) Maiores de 18 anos. 2) Pagamento exclusivo via Pix. 3) Números válidos após confirmação do pagamento. 4) Sorteio em data divulgada no site.",
      modoSelecaoNumeros: NumberSelectionMode.MIXED,
      quantidadeMinimaCompra: 100,
      quantidadeMaximaCompra: 500,
      multiploCompra: null,
      reservaExpiraMinutos: 20,
      exibirRankingPublico: true,
      anonimizarRankingPublico: true,
      tamanhoRankingPublico: 10,
      ativarFeedCompras: true,
      ativarContadorTempoReal: true,
      ativarWhatsapp: true,
      mensagemWhatsappPadrao: null,
      status: RaffleStatus.ACTIVE,
    },
  });

  const batchSize = 500;
  for (let start = 1; start <= total; start += batchSize) {
    const end = Math.min(start + batchSize - 1, total);
    const nums = [];
    for (let n = start; n <= end; n++) {
      nums.push({
        raffleId: raffle.id,
        numero: String(n).padStart(padding, "0"),
        status: RaffleNumberStatus.AVAILABLE,
      });
    }
    await prisma.raffleNumber.createMany({ data: nums });
  }

  console.log("Seed concluído: admin@rifa.com / 123456 — rifa Descubra na Rua com", total, "números.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
