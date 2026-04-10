"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RaffleForm, type RaffleFormInitial } from "@/components/admin/raffle-form";
import { RaffleSorteioPanel } from "@/components/admin/raffle-sorteio-panel";
import { adminBtnDanger, adminBtnSecondary } from "@/components/admin/admin-styles";

type RaffleDetail = {
  id: string;
  titulo: string;
  status: string;
  slug: string;
  valorNumero: number;
  quantidadeTotal: number;
  numeroPadding: number;
  dataSorteio: string;
  modoSelecaoNumeros: RaffleFormInitial["modoSelecaoNumeros"];
  descricao: string;
  premio: string;
  regulamento: string;
  imagem: string | null;
  quantidadeMinimaCompra: number;
  quantidadeMaximaCompra: number;
  multiploCompra: number | null;
  reservaExpiraMinutos: number;
  exibirRankingPublico: boolean;
  anonimizarRankingPublico: boolean;
  tamanhoRankingPublico: number;
  ativarFeedCompras: boolean;
  ativarContadorTempoReal: boolean;
  ativarWhatsapp: boolean;
  mensagemWhatsappPadrao: string | null;
  numeroVencedor: { id: string; numero: string } | null;
  _count: { numbers: number; reservations: number };
};

export default function AdminRifaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [r, setR] = useState<RaffleDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErr(null);
    try {
      const data = await adminFetch<RaffleDetail>(`/api/admin/raffles/${id}`);
      setR(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function excluir() {
    if (!r) return;
    if (!window.confirm("Excluir esta rifa? Só é permitido em rascunho e sem reservas.")) return;
    try {
      await adminFetch(`/api/admin/raffles/${r.id}`, { method: "DELETE" });
      router.push("/admin/rifas");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  if (!id) return null;
  if (err && !r) return <p className="text-red-400">{err}</p>;
  if (!r) return <p className="text-[#888]">Carregando…</p>;

  const initial: Partial<RaffleFormInitial> = {
    titulo: r.titulo,
    descricao: r.descricao,
    premio: r.premio,
    regulamento: r.regulamento,
    imagem: r.imagem,
    valorNumero: r.valorNumero,
    dataSorteio: r.dataSorteio,
    modoSelecaoNumeros: r.modoSelecaoNumeros,
    quantidadeMinimaCompra: r.quantidadeMinimaCompra,
    quantidadeMaximaCompra: r.quantidadeMaximaCompra,
    multiploCompra: r.multiploCompra,
    reservaExpiraMinutos: r.reservaExpiraMinutos,
    exibirRankingPublico: r.exibirRankingPublico,
    anonimizarRankingPublico: r.anonimizarRankingPublico,
    tamanhoRankingPublico: r.tamanhoRankingPublico,
    ativarFeedCompras: r.ativarFeedCompras,
    ativarContadorTempoReal: r.ativarContadorTempoReal,
    ativarWhatsapp: r.ativarWhatsapp,
    mensagemWhatsappPadrao: r.mensagemWhatsappPadrao,
    status: r.status as RaffleFormInitial["status"],
  };

  return (
    <div>
      <AdminPageHeader
        title={r.titulo}
        subtitle={`Slug: ${r.slug} · Números gerados: ${r._count.numbers} · Reservas: ${r._count.reservations}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Rifas", href: "/admin/rifas" },
          { label: r.titulo },
        ]}
        actions={
          <div className="flex gap-2">
            <a href={`/admin/numeros?raffleId=${r.id}`} className={adminBtnSecondary}>
              Ver números
            </a>
            {r.status === "DRAFT" && r._count.reservations === 0 && (
              <button type="button" className={adminBtnDanger} onClick={() => void excluir()}>
                Excluir
              </button>
            )}
          </div>
        }
      />
      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}
      <p className="mb-6 text-sm text-[#888]">
        Quantidade total cadastrada: {r.quantidadeTotal} (não altera após criação)
      </p>
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#101010] p-6 md:p-8">
        <RaffleForm mode="edit" raffleId={r.id} initial={initial} />
      </div>
      <div className="mt-8">
        <RaffleSorteioPanel
          raffleId={r.id}
          numeroPadding={r.numeroPadding}
          currentWinnerNumero={r.numeroVencedor?.numero ?? null}
        />
      </div>
    </div>
  );
}
