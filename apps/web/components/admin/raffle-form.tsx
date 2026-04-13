"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { adminInput, adminLabel, adminBtnSecondary } from "./admin-styles";
import { GoldButton } from "@/components/gold-button";

type Mode = "create" | "edit";

export type RaffleFormInitial = {
  titulo: string;
  descricao: string;
  premio: string;
  regulamento: string;
  imagem: string | null;
  valorNumero: number;
  quantidadeTotal?: number;
  numeroPadding?: number;
  dataSorteio: string;
  modoSelecaoNumeros: "MANUAL" | "RANDOM" | "MIXED";
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
  checkoutPedirEmail: boolean;
  checkoutPedirCpf: boolean;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "DRAWN";
  slug?: string;
};

const defaultCreate = (): RaffleFormInitial => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const iso = d.toISOString().slice(0, 16);
  return {
    titulo: "",
    descricao: "",
    premio: "",
    regulamento: "",
    imagem: "",
    valorNumero: 1,
    quantidadeTotal: 1000,
    numeroPadding: 4,
    dataSorteio: iso,
    modoSelecaoNumeros: "RANDOM",
    quantidadeMinimaCompra: 1,
    quantidadeMaximaCompra: 50,
    multiploCompra: null,
    reservaExpiraMinutos: 20,
    exibirRankingPublico: true,
    anonimizarRankingPublico: true,
    tamanhoRankingPublico: 10,
    ativarFeedCompras: true,
    ativarContadorTempoReal: true,
    ativarWhatsapp: true,
    mensagemWhatsappPadrao: "",
    checkoutPedirEmail: false,
    checkoutPedirCpf: false,
    status: "DRAFT",
  };
};

export function RaffleForm({
  mode,
  raffleId,
  initial,
}: {
  mode: Mode;
  raffleId?: string;
  initial?: Partial<RaffleFormInitial>;
}) {
  const router = useRouter();
  const [f, setF] = useState<RaffleFormInitial>(() => ({
    ...defaultCreate(),
    ...initial,
    ...(initial?.dataSorteio
      ? {
          dataSorteio: initial.dataSorteio.includes("T")
            ? initial.dataSorteio.slice(0, 16)
            : new Date(initial.dataSorteio).toISOString().slice(0, 16),
        }
      : {}),
  }));
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof RaffleFormInitial>(k: K, v: RaffleFormInitial[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const dataSorteioIso = new Date(f.dataSorteio).toISOString();
      if (mode === "create") {
        const body = {
          titulo: f.titulo,
          descricao: f.descricao,
          premio: f.premio,
          regulamento: f.regulamento,
          imagem: f.imagem || null,
          valorNumero: f.valorNumero,
          quantidadeTotal: f.quantidadeTotal ?? 1000,
          numeroPadding: f.numeroPadding ?? 4,
          dataSorteio: dataSorteioIso,
          modoSelecaoNumeros: f.modoSelecaoNumeros,
          quantidadeMinimaCompra: f.quantidadeMinimaCompra,
          quantidadeMaximaCompra: f.quantidadeMaximaCompra,
          multiploCompra: f.multiploCompra,
          reservaExpiraMinutos: f.reservaExpiraMinutos,
          exibirRankingPublico: f.exibirRankingPublico,
          anonimizarRankingPublico: f.anonimizarRankingPublico,
          tamanhoRankingPublico: f.tamanhoRankingPublico,
          ativarFeedCompras: f.ativarFeedCompras,
          ativarContadorTempoReal: f.ativarContadorTempoReal,
          ativarWhatsapp: f.ativarWhatsapp,
          mensagemWhatsappPadrao: f.mensagemWhatsappPadrao || null,
          checkoutPedirEmail: f.checkoutPedirEmail,
          checkoutPedirCpf: f.checkoutPedirCpf,
          status: f.status,
        };
        const res = await adminFetch<{ id: string }>("/api/admin/raffles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        router.push(`/admin/rifas/${res.id}`);
        router.refresh();
      } else if (raffleId) {
        await adminFetch(`/api/admin/raffles/${raffleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: f.titulo,
            descricao: f.descricao,
            premio: f.premio,
            regulamento: f.regulamento,
            imagem: f.imagem || null,
            valorNumero: f.valorNumero,
            dataSorteio: dataSorteioIso,
            modoSelecaoNumeros: f.modoSelecaoNumeros,
            quantidadeMinimaCompra: f.quantidadeMinimaCompra,
            quantidadeMaximaCompra: f.quantidadeMaximaCompra,
            multiploCompra: f.multiploCompra,
            reservaExpiraMinutos: f.reservaExpiraMinutos,
            exibirRankingPublico: f.exibirRankingPublico,
            anonimizarRankingPublico: f.anonimizarRankingPublico,
            tamanhoRankingPublico: f.tamanhoRankingPublico,
            ativarFeedCompras: f.ativarFeedCompras,
            ativarContadorTempoReal: f.ativarContadorTempoReal,
            ativarWhatsapp: f.ativarWhatsapp,
            mensagemWhatsappPadrao: f.mensagemWhatsappPadrao || null,
            checkoutPedirEmail: f.checkoutPedirEmail,
            checkoutPedirCpf: f.checkoutPedirCpf,
            status: f.status,
          }),
        });
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <label className={adminLabel}>
          Título
          <input className={adminInput} value={f.titulo} onChange={(e) => set("titulo", e.target.value)} required />
        </label>
        <label className={adminLabel}>
          Status
          <select
            className={adminInput}
            value={f.status}
            onChange={(e) => set("status", e.target.value as RaffleFormInitial["status"])}
          >
            <option value="DRAFT">Rascunho</option>
            <option value="ACTIVE">Ativa</option>
            <option value="CLOSED">Encerrada</option>
            <option value="DRAWN">Sorteada</option>
          </select>
        </label>
      </div>
      <label className={adminLabel}>
        Descrição
        <textarea className={`${adminInput} min-h-[100px]`} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} required />
      </label>
      <label className={adminLabel}>
        Prêmio
        <textarea className={`${adminInput} min-h-[80px]`} value={f.premio} onChange={(e) => set("premio", e.target.value)} required />
      </label>
      <label className={adminLabel}>
        Regulamento
        <textarea className={`${adminInput} min-h-[120px]`} value={f.regulamento} onChange={(e) => set("regulamento", e.target.value)} required />
      </label>
      <div className="grid gap-6 md:grid-cols-2">
        <label className={adminLabel}>
          URL da imagem (opcional)
          <input className={adminInput} value={f.imagem ?? ""} onChange={(e) => set("imagem", e.target.value || null)} placeholder="https://..." />
        </label>
        <label className={adminLabel}>
          Valor por número (R$)
          <input
            type="number"
            step="0.01"
            min={0.01}
            className={adminInput}
            value={f.valorNumero}
            onChange={(e) => set("valorNumero", Number(e.target.value))}
            required
          />
        </label>
      </div>
      {mode === "create" && (
        <div className="grid gap-6 md:grid-cols-3">
          <label className={adminLabel}>
            Qtd. total de números
            <input
              type="number"
              min={1}
              max={500000}
              className={adminInput}
              value={f.quantidadeTotal ?? 1000}
              onChange={(e) => set("quantidadeTotal", Number(e.target.value))}
              required
            />
          </label>
          <label className={adminLabel}>
            Padding (dígitos)
            <input
              type="number"
              min={1}
              max={8}
              className={adminInput}
              value={f.numeroPadding ?? 4}
              onChange={(e) => set("numeroPadding", Number(e.target.value))}
              required
            />
          </label>
          <label className={adminLabel}>
            Data do sorteio
            <input
              type="datetime-local"
              className={adminInput}
              value={f.dataSorteio}
              onChange={(e) => set("dataSorteio", e.target.value)}
              required
            />
          </label>
        </div>
      )}
      {mode === "edit" && (
        <label className={adminLabel}>
          Data do sorteio
          <input
            type="datetime-local"
            className={adminInput}
            value={f.dataSorteio}
            onChange={(e) => set("dataSorteio", e.target.value)}
            required
          />
        </label>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <label className={adminLabel}>
          Modo de seleção
          <select
            className={adminInput}
            value={f.modoSelecaoNumeros}
            onChange={(e) => set("modoSelecaoNumeros", e.target.value as RaffleFormInitial["modoSelecaoNumeros"])}
          >
            <option value="MANUAL">Manual</option>
            <option value="RANDOM">Aleatório</option>
            <option value="MIXED">Misto</option>
          </select>
        </label>
        <label className={adminLabel}>
          Expiração da reserva (minutos)
          <input
            type="number"
            min={5}
            max={1440}
            className={adminInput}
            value={f.reservaExpiraMinutos}
            onChange={(e) => set("reservaExpiraMinutos", Number(e.target.value))}
          />
        </label>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <label className={adminLabel}>
          Mín. compra
          <input
            type="number"
            min={1}
            className={adminInput}
            value={f.quantidadeMinimaCompra}
            onChange={(e) => set("quantidadeMinimaCompra", Number(e.target.value))}
          />
        </label>
        <label className={adminLabel}>
          Máx. compra
          <input
            type="number"
            min={1}
            className={adminInput}
            value={f.quantidadeMaximaCompra}
            onChange={(e) => set("quantidadeMaximaCompra", Number(e.target.value))}
          />
        </label>
        <label className={adminLabel}>
          Múltiplo (opcional)
          <input
            type="number"
            min={1}
            className={adminInput}
            value={f.multiploCompra ?? ""}
            onChange={(e) => set("multiploCompra", e.target.value ? Number(e.target.value) : null)}
            placeholder="vazio = qualquer"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["exibirRankingPublico", "Exibir ranking público"],
          ["anonimizarRankingPublico", "Anonimizar ranking público"],
          ["ativarFeedCompras", "Feed de compras recentes"],
          ["ativarContadorTempoReal", "Contador em tempo real"],
          ["ativarWhatsapp", "Integração WhatsApp"],
        ].map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-[#BDBDBD]">
            <input
              type="checkbox"
              checked={f[k as keyof RaffleFormInitial] as boolean}
              onChange={(e) => set(k as keyof RaffleFormInitial, e.target.checked as never)}
              className="rounded border-white/20 bg-[#161616]"
            />
            {label}
          </label>
        ))}
      </div>
      <label className={adminLabel}>
        Tamanho do ranking público
        <input
          type="number"
          min={1}
          max={100}
          className={adminInput}
          value={f.tamanhoRankingPublico}
          onChange={(e) => set("tamanhoRankingPublico", Number(e.target.value))}
        />
      </label>
      <label className={adminLabel}>
        Mensagem padrão WhatsApp (opcional)
        <textarea
          className={`${adminInput} min-h-[80px]`}
          value={f.mensagemWhatsappPadrao ?? ""}
          onChange={(e) => set("mensagemWhatsappPadrao", e.target.value || null)}
        />
      </label>
      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0d0d0d] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Checkout público</p>
        <p className="mt-1 text-xs text-[#888]">
          Por defeito só nome e WhatsApp. Ative abaixo se quiser pedir e-mail ou CPF (recomendado CPF para Pix real no Mercado Pago).
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#BDBDBD]">
            <input
              type="checkbox"
              checked={f.checkoutPedirEmail}
              onChange={(e) => set("checkoutPedirEmail", e.target.checked)}
              className="rounded border-white/20 bg-[#161616]"
            />
            Pedir e-mail no checkout
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#BDBDBD]">
            <input
              type="checkbox"
              checked={f.checkoutPedirCpf}
              onChange={(e) => set("checkoutPedirCpf", e.target.checked)}
              className="rounded border-white/20 bg-[#161616]"
            />
            Pedir CPF no checkout
          </label>
        </div>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <GoldButton type="submit" disabled={loading}>
          {loading ? "Salvando…" : mode === "create" ? "Criar rifa" : "Salvar alterações"}
        </GoldButton>
        <button type="button" className={adminBtnSecondary} onClick={() => router.back()}>
          Voltar
        </button>
      </div>
    </form>
  );
}
