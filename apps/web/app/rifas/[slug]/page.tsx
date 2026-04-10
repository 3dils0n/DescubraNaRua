import { notFound } from "next/navigation";
import { prisma } from "@repo/db";
import { RaffleStatus } from "@prisma/client";
import { RaffleClient } from "@/components/raffle-client";

type Props = { params: Promise<{ slug: string }> };

export default async function RafflePage(props: Props) {
  const { slug } = await props.params;
  const r = await prisma.raffle.findUnique({ where: { slug } });
  if (!r || r.status !== RaffleStatus.ACTIVE) notFound();

  const [paid, total] = await Promise.all([
    prisma.raffleNumber.count({ where: { raffleId: r.id, status: "PAID" } }),
    prisma.raffleNumber.count({ where: { raffleId: r.id } }),
  ]);
  const pct = total ? (paid / total) * 100 : 0;

  const initial = {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descricao: r.descricao,
    premio: r.premio,
    imagem: r.imagem,
    valorNumero: Number(r.valorNumero),
    quantidadeTotal: r.quantidadeTotal,
    dataSorteio: r.dataSorteio.toISOString(),
    regulamento: r.regulamento,
    modoSelecaoNumeros: r.modoSelecaoNumeros,
    quantidadeMinimaCompra: r.quantidadeMinimaCompra,
    quantidadeMaximaCompra: r.quantidadeMaximaCompra,
    multiploCompra: r.multiploCompra,
    sold: paid,
    totalNumbers: total,
    percent: pct,
    exibirRankingPublico: r.exibirRankingPublico,
    anonimizarRankingPublico: r.anonimizarRankingPublico,
    tamanhoRankingPublico: r.tamanhoRankingPublico,
    ativarFeedCompras: r.ativarFeedCompras,
    ativarContadorTempoReal: r.ativarContadorTempoReal,
  };

  return <RaffleClient initial={initial} />;
}
