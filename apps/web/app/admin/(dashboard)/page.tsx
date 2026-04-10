"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { adminCard, adminTableWrap, adminTh, adminTd } from "@/components/admin/admin-styles";

type Dash = {
  totalRaffles: number;
  activeRaffles: number;
  paidNumbers: number;
  pendingReservations: number;
  paidToday: number;
  expiredPix: number;
  whatsappFailed: number;
  whatsappPending: number;
  totalRevenue: number;
  webhooksPending: number;
  webhooksFailed: number;
  failedPix: number;
  chartSeries: { date: string; paidCount: number; revenue: number }[];
  mainProgress: { titulo: string; slug: string; paid: number; total: number; pct: number } | null;
  topBuyers: { nome: string; telefone: string; qty: number; spent: number }[];
  recentReservations: {
    id: string;
    codigo: string;
    createdAt: string;
    raffle: { titulo: string };
    participant: { nome: string; telefone: string };
  }[];
  recentPayments: {
    id: string;
    valor: number;
    paidAt: string | null;
    codigo: string;
    rifa: string;
  }[];
  failedWebhooksList: { id: string; topic: string | null; resourceId: string | null; lastError: string | null; attempts: number; createdAt: string }[];
  failedWaList: { id: string; codigo: string; nome: string; erro: string | null; tentativas: number }[];
};

export default function AdminDashboardPage() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Dash>("/api/admin/dashboard");
        setD(data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, []);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!d) return <p className="text-[#BDBDBD]">Carregando…</p>;

  const maxRev = Math.max(1, ...d.chartSeries.map((x) => x.revenue));
  const maxCnt = Math.max(1, ...d.chartSeries.map((x) => x.paidCount));

  const kpi = [
    { label: "Rifas (total)", val: d.totalRaffles },
    { label: "Rifas ativas", val: d.activeRaffles },
    { label: "Números pagos", val: d.paidNumbers },
    { label: "Reservas pendentes", val: d.pendingReservations },
    { label: "Pagos hoje", val: d.paidToday },
    { label: "Pix expirados", val: d.expiredPix },
    { label: "Pix com erro", val: d.failedPix },
    { label: "WA pendente", val: d.whatsappPending },
    { label: "WA falha", val: d.whatsappFailed },
    { label: "Webhook pendente", val: d.webhooksPending },
    { label: "Webhook falha", val: d.webhooksFailed },
    {
      label: "Arrecadação (paga)",
      val: d.totalRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-[#F2C94C]">Dashboard</h1>
      <p className="mt-2 text-sm text-[#BDBDBD]">Visão geral da operação</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpi.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[#D4AF37]/20 bg-[#101010] p-5 shadow-[0_0_24px_rgba(212,175,55,0.08)]"
          >
            <p className="text-[10px] uppercase tracking-wider text-[#888]">{c.label}</p>
            <p className="mt-2 font-display text-2xl text-[#F5F5F5]">{c.val}</p>
          </div>
        ))}
      </div>

      {d.mainProgress && (
        <div className={`${adminCard} mt-10`}>
          <h2 className="text-sm font-semibold text-[#D4AF37]">Progresso — rifa ativa principal</h2>
          <p className="mt-1 text-lg text-[#F5F5F5]">{d.mainProgress.titulo}</p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8C6A1D] to-[#F2C94C]"
              style={{ width: `${Math.min(100, d.mainProgress.pct)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#888]">
            {d.mainProgress.paid} / {d.mainProgress.total} ({d.mainProgress.pct}%)
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className={adminCard}>
          <h2 className="text-sm font-semibold text-[#D4AF37]">Pagamentos (14 dias) — receita</h2>
          <div className="mt-6 flex h-48 items-end gap-1">
            {d.chartSeries.map((x) => (
              <div key={x.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#D4AF37]/50 transition-all hover:bg-[#D4AF37]/70"
                  style={{ height: `${Math.max(4, (x.revenue / maxRev) * 100)}%` }}
                  title={`${x.date}: ${x.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
                />
                <span className="text-[8px] text-[#555]">{x.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={adminCard}>
          <h2 className="text-sm font-semibold text-[#D4AF37]">Reservas pagas (14 dias) — quantidade</h2>
          <div className="mt-6 flex h-48 items-end gap-1">
            {d.chartSeries.map((x) => (
              <div key={x.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#4A4A4A]"
                  style={{ height: `${Math.max(4, (x.paidCount / maxCnt) * 100)}%` }}
                  title={`${x.date}: ${x.paidCount}`}
                />
                <span className="text-[8px] text-[#555]">{x.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[#D4AF37]">Top compradores</h2>
          <div className={adminTableWrap}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Nome</th>
                  <th className={adminTh}>Qtd</th>
                  <th className={adminTh}>Total</th>
                </tr>
              </thead>
              <tbody>
                {d.topBuyers.map((b) => (
                  <tr key={b.telefone + b.nome} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>
                      {b.nome}
                      <span className="block text-xs text-[#666]">{b.telefone}</span>
                    </td>
                    <td className={adminTd}>{b.qty}</td>
                    <td className={adminTd}>{b.spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[#D4AF37]">Últimas reservas</h2>
          <div className={adminTableWrap}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Código</th>
                  <th className={adminTh}>Rifa</th>
                  <th className={adminTh}>Quando</th>
                </tr>
              </thead>
              <tbody>
                {d.recentReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>
                      <Link href={`/admin/reservas/${r.id}`} className="text-[#D4AF37] hover:underline">
                        {r.codigo}
                      </Link>
                    </td>
                    <td className={`${adminTd} max-w-[140px] truncate`}>{r.raffle.titulo}</td>
                    <td className={`${adminTd} text-xs`}>{new Date(r.createdAt).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[#D4AF37]">Últimos pagamentos confirmados</h2>
          <div className={adminTableWrap}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Reserva</th>
                  <th className={adminTh}>Valor</th>
                  <th className={adminTh}>Pago em</th>
                </tr>
              </thead>
              <tbody>
                {d.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>
                      <Link href={`/admin/pagamentos/${p.id}`} className="text-[#D4AF37] hover:underline">
                        {p.codigo}
                      </Link>
                      <span className="block text-xs text-[#666]">{p.rifa}</span>
                    </td>
                    <td className={adminTd}>{p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className={`${adminTd} text-xs`}>{p.paidAt ? new Date(p.paidAt).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[#D4AF37]">Webhooks com falha</h2>
          <div className={adminTableWrap}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>ID</th>
                  <th className={adminTh}>Erro</th>
                </tr>
              </thead>
              <tbody>
                {d.failedWebhooksList.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>
                      <Link href={`/admin/webhooks/${w.id}`} className="font-mono text-xs text-[#D4AF37] hover:underline">
                        {w.id.slice(0, 10)}…
                      </Link>
                    </td>
                    <td className={`${adminTd} max-w-[200px] truncate text-xs text-red-300/90`}>{w.lastError ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-[#D4AF37]">WhatsApp com falha</h2>
        <div className={adminTableWrap}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#0d0d0d]">
                <th className={adminTh}>Reserva</th>
                <th className={adminTh}>Participante</th>
                <th className={adminTh}>Erro</th>
                <th className={adminTh}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {d.failedWaList.map((w) => (
                <tr key={w.id} className="hover:bg-white/[0.02]">
                  <td className={adminTd}>{w.codigo}</td>
                  <td className={adminTd}>{w.nome}</td>
                  <td className={`${adminTd} max-w-[240px] truncate text-xs text-red-300/90`}>{w.erro ?? "—"}</td>
                  <td className={adminTd}>
                    <Link href={`/admin/whatsapp/${w.id}`} className="text-[#D4AF37] hover:underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
