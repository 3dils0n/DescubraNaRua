"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GoldButton } from "@/components/gold-button";
import { ProgressGold } from "@/components/progress-gold";
import { SiteHeader } from "@/components/site-header";

type Raffle = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  premio: string;
  imagem: string | null;
  valorNumero: number;
  quantidadeTotal: number;
  dataSorteio: string;
  regulamento: string;
  modoSelecaoNumeros: "MANUAL" | "RANDOM" | "MIXED";
  quantidadeMinimaCompra: number;
  quantidadeMaximaCompra: number;
  multiploCompra: number | null;
  sold: number;
  totalNumbers: number;
  percent: number;
  exibirRankingPublico: boolean;
  anonimizarRankingPublico: boolean;
  tamanhoRankingPublico: number;
  ativarFeedCompras: boolean;
  ativarContadorTempoReal: boolean;
};

type StatPayload = {
  totalNumbers: number;
  sold: number;
  reserved: number;
  remaining: number;
  percentSold: number;
  recentPurchases: { name: string; qty: number; at: string }[];
};

type NumRow = { id: string; numero: string; status: string };

const statusLabels: Record<string, string> = {
  AVAILABLE: "livre",
  RESERVED: "reservado",
  PAID: "pago",
  BLOCKED: "bloqueado",
};

export function RaffleClient({ initial }: { initial: Raffle }) {
  const [stats, setStats] = useState<StatPayload | null>(null);
  const [ranking, setRanking] = useState<{ position: number; name: string; quantity: number }[]>([]);
  const [numbers, setNumbers] = useState<NumRow[]>([]);
  const [numbersTotal, setNumbersTotal] = useState(0);
  const [mode, setMode] = useState<"manual" | "random">(
    initial.modoSelecaoNumeros === "RANDOM" ? "random" : "manual",
  );
  const [qtyRandom, setQtyRandom] = useState(initial.quantidadeMinimaCompra);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const slug = initial.slug;

  const load = useCallback(async () => {
    const [s, r, n] = await Promise.all([
      fetch(`/api/public/raffles/${slug}/stats`).then((res) => res.json()),
      fetch(`/api/public/raffles/${slug}/ranking`).then((res) => res.json()),
      fetch(`/api/public/raffles/${slug}/numbers?take=500&skip=0`).then((res) => res.json()),
    ]);
    setStats(s);
    setRanking(r.ranking ?? []);
    setNumbers(n.numbers ?? []);
    setNumbersTotal(n.total ?? 0);
  }, [slug]);

  useEffect(() => {
    load();
    if (!initial.ativarContadorTempoReal) return;
    const t = setInterval(load, 12_000);
    return () => clearInterval(t);
  }, [initial.ativarContadorTempoReal, load]);

  const pct = stats?.percentSold ?? initial.percent;
  const sold = stats?.sold ?? initial.sold;
  const remaining = stats?.remaining ?? initial.totalNumbers - initial.sold;

  const toggle = (row: NumRow) => {
    if (row.status !== "AVAILABLE") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  };

  const goCheckout = () => {
    const payload = {
      raffleSlug: slug,
      modo: initial.modoSelecaoNumeros,
      numberIds:
        initial.modoSelecaoNumeros === "RANDOM" || (initial.modoSelecaoNumeros === "MIXED" && mode === "random")
          ? []
          : Array.from(selected),
      quantity:
        initial.modoSelecaoNumeros === "RANDOM" || (initial.modoSelecaoNumeros === "MIXED" && mode === "random")
          ? qtyRandom
          : undefined,
      useRandom:
        initial.modoSelecaoNumeros === "RANDOM" ||
        (initial.modoSelecaoNumeros === "MIXED" && mode === "random"),
    };
    sessionStorage.setItem("checkout_payload", JSON.stringify(payload));
    window.location.href = `/rifas/${slug}/checkout`;
  };

  const canProceed = useMemo(() => {
    if (initial.modoSelecaoNumeros === "RANDOM") return qtyRandom >= initial.quantidadeMinimaCompra;
    if (initial.modoSelecaoNumeros === "MIXED" && mode === "random")
      return qtyRandom >= initial.quantidadeMinimaCompra;
    return selected.size >= initial.quantidadeMinimaCompra;
  }, [initial, mode, qtyRandom, selected]);

  const urgency =
    remaining <= 50 ? "Últimos números acabando" : sold > 200 ? "Rifa acelerando agora" : "Oportunidade limitada";

  return (
    <main className="min-h-screen pb-28">
      <SiteHeader />

      <section className="relative">
        <div className="relative aspect-[21/9] max-h-[320px] w-full bg-gradient-to-br from-[#2a2410] to-[#0a0a0a]">
          {initial.imagem ? (
            <Image src={initial.imagem} alt="" fill className="object-cover opacity-90" priority sizes="100vw" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="mx-auto max-w-6xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                Campanha em alta
              </p>
              <h1 className="font-display text-3xl text-[#F5F5F5] md:text-5xl">{initial.titulo}</h1>
              <p className="mt-3 max-w-2xl text-[#BDBDBD]">{initial.descricao}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="animate-pulse-soft rounded-full border border-[#D4AF37]/40 bg-[#101010] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#F2C94C]">
            {urgency}
          </span>
          <span className="rounded-full bg-[#161616] px-3 py-1 text-xs text-[#BDBDBD]">
            {initial.ativarFeedCompras && stats?.recentPurchases?.length
              ? `${stats.recentPurchases.length}+ movimentos recentes`
              : "Compra segura"}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
              <h2 className="font-display text-xl text-[#F5F5F5]">Progresso</h2>
              <p className="mt-2 text-sm text-[#BDBDBD]">
                {sold} vendidos · {remaining} restantes · {pct.toFixed(1)}% da campanha
              </p>
              <div className="mt-4">
                <ProgressGold value={pct} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
              <h2 className="font-display text-xl text-[#F5F5F5]">Prêmio</h2>
              <p className="mt-3 whitespace-pre-wrap text-[#BDBDBD]">{initial.premio}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
              <h2 className="font-display text-xl text-[#F5F5F5]">Regulamento</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#BDBDBD]">
                {initial.regulamento}
              </p>
            </div>

            <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#0f0f0f] p-6">
              <h2 className="font-display text-xl text-[#F2C94C]">Escolha seus números</h2>
              <p className="mt-2 text-sm text-[#BDBDBD]">
                Valor por número:{" "}
                <strong className="text-[#F5F5F5]">
                  {initial.valorNumero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>
                {" · "}
                Mínimo {initial.quantidadeMinimaCompra} números · Máximo {initial.quantidadeMaximaCompra}
                {initial.multiploCompra ? ` · Múltiplos de ${initial.multiploCompra}` : ""}
              </p>

              {initial.modoSelecaoNumeros === "MIXED" && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      mode === "manual" ? "bg-[#D4AF37] text-[#0A0A0A]" : "border border-white/10 text-[#BDBDBD]"
                    }`}
                  >
                    Escolher na grade
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("random")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      mode === "random" ? "bg-[#D4AF37] text-[#0A0A0A]" : "border border-white/10 text-[#BDBDBD]"
                    }`}
                  >
                    Gerar aleatórios
                  </button>
                </div>
              )}

              {(initial.modoSelecaoNumeros === "RANDOM" ||
                (initial.modoSelecaoNumeros === "MIXED" && mode === "random")) && (
                <div className="mt-6">
                  <label className="text-sm text-[#BDBDBD]">Quantidade</label>
                  <input
                    type="number"
                    min={initial.quantidadeMinimaCompra}
                    max={initial.quantidadeMaximaCompra}
                    value={qtyRandom}
                    onChange={(e) => setQtyRandom(Number(e.target.value))}
                    className="mt-2 w-full max-w-xs rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
                  />
                </div>
              )}

              {(initial.modoSelecaoNumeros === "MANUAL" ||
                (initial.modoSelecaoNumeros === "MIXED" && mode === "manual")) && (
                  <div className="mt-6">
                    <p className="mb-3 text-xs text-[#888]">
                      Grade ({numbers.length} mostrados de {numbersTotal}) — toque nos disponíveis
                    </p>
                    <div className="grid max-h-[420px] grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-white/5 bg-[#0A0A0A] p-3 sm:grid-cols-8 md:grid-cols-10">
                      {numbers.map((n) => {
                        const sel = selected.has(n.id);
                        const available = n.status === "AVAILABLE";
                        return (
                          <button
                            key={n.id}
                            type="button"
                            disabled={!available}
                            onClick={() => toggle(n)}
                            title={statusLabels[n.status] ?? n.status}
                            className={`rounded-lg py-2 text-xs font-mono transition ${
                              available
                                ? sel
                                  ? "bg-[#D4AF37] text-[#0A0A0A] shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                                  : "bg-[#161616] text-[#F5F5F5] hover:border hover:border-[#D4AF37]/50"
                                : n.status === "PAID"
                                  ? "cursor-not-allowed bg-[#0f0f0f] text-[#555] line-through"
                                  : "cursor-not-allowed bg-[#0f0f0f] text-[#555]"
                            }`}
                          >
                            {n.numero}
                          </button>
                        );
                      })}
                    </div>
                  </div>
              )}

            </div>

            {initial.exibirRankingPublico && ranking.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
                <h2 className="font-display text-xl text-[#F5F5F5]">Top compradores</h2>
                <ul className="mt-4 space-y-3">
                  {ranking.slice(0, initial.tamanhoRankingPublico).map((row) => (
                    <li
                      key={row.position}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-[#161616] px-4 py-3"
                    >
                      <span className="text-[#D4AF37]">#{row.position}</span>
                      <span className="text-[#F5F5F5]">{row.name}</span>
                      <span className="text-sm text-[#BDBDBD]">{row.quantity} números</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {initial.ativarFeedCompras && stats?.recentPurchases?.length ? (
              <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
                <h2 className="font-display text-xl text-[#F5F5F5]">Quem comprou recentemente</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#BDBDBD]">
                  {stats.recentPurchases.slice(0, 8).map((p, i) => (
                    <li key={i}>
                      <strong className="text-[#F5F5F5]">{p.name}</strong> — {p.qty} números
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#101010] p-6">
              <p className="text-xs uppercase text-[#888]">Sorteio</p>
              <p className="mt-1 font-display text-2xl text-[#F2C94C]">
                {new Date(initial.dataSorteio).toLocaleString("pt-BR")}
              </p>
              <p className="mt-4 text-sm text-[#BDBDBD]">
                Total mínimo:{" "}
                {(initial.valorNumero * initial.quantidadeMinimaCompra).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D4AF37]/20 bg-[#0A0A0A]/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-sm text-[#BDBDBD]">
            <span className="text-[#F5F5F5]">{selected.size || qtyRandom}</span> números selecionados
          </div>
          <GoldButton onClick={goCheckout} disabled={!canProceed}>
            Continuar para Pix
          </GoldButton>
        </div>
      </div>
    </main>
  );
}
