"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminTableWrap, adminTh, adminTd, adminInput, adminLabel, adminBtnSecondary } from "@/components/admin/admin-styles";

type Row = {
  position: number;
  nome: string;
  telefone: string;
  email: string;
  quantidadeNumeros: number;
  valorTotal: number;
  rifas: string;
};

export default function AdminRankingPage() {
  const [f, setF] = useState({ raffleId: "", limit: "20", q: "", from: "", to: "" });
  const [items, setItems] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const qs = new URLSearchParams({ limit: f.limit });
      if (f.raffleId) qs.set("raffleId", f.raffleId);
      if (f.q) qs.set("q", f.q);
      if (f.from) qs.set("from", f.from);
      if (f.to) qs.set("to", f.to);
      const res = await adminFetch<{ items: Row[] }>(`/api/admin/ranking?${qs}`);
      setItems(res.items);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial; filtros via "Atualizar"
  }, []);

  function exportCsv() {
    if (!items?.length) return;
    const header = ["posicao", "nome", "telefone", "email", "qtd_numeros", "valor_total", "rifas"];
    const lines = [header.join(";")];
    for (const r of items) {
      lines.push(
        [r.position, r.nome, r.telefone, r.email, r.quantidadeNumeros, r.valorTotal.toFixed(2), `"${r.rifas.replace(/"/g, '""')}"`].join(
          ";",
        ),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ranking-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <AdminPageHeader
        title="Ranking de compradores"
        subtitle="Agregado por participante (pagamentos confirmados)"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Ranking" }]}
        actions={
          <button type="button" className={adminBtnSecondary} onClick={exportCsv}>
            Exportar CSV
          </button>
        }
      />
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabel}>
          Top N
          <select className={adminInput} value={f.limit} onChange={(e) => setF((x) => ({ ...x, limit: e.target.value }))}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <label className={adminLabel}>
          ID rifa (opcional)
          <input className={adminInput} value={f.raffleId} onChange={(e) => setF((x) => ({ ...x, raffleId: e.target.value }))} />
        </label>
        <label className={adminLabel}>
          Buscar comprador
          <input
            className={adminInput}
            value={f.q}
            onChange={(e) => setF((x) => ({ ...x, q: e.target.value }))}
            placeholder="nome, email ou telefone"
          />
        </label>
        <label className={adminLabel}>
          Período pago — de (ISO)
          <input className={adminInput} value={f.from} onChange={(e) => setF((x) => ({ ...x, from: e.target.value }))} />
        </label>
        <label className={adminLabel}>
          Período pago — até (ISO)
          <input className={adminInput} value={f.to} onChange={(e) => setF((x) => ({ ...x, to: e.target.value }))} />
        </label>
        <div className="flex items-end">
          <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
            Atualizar
          </button>
        </div>
      </div>
      {err && <p className="text-red-400">{err}</p>}
      {!items ? (
        <p className="text-[#888]">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-[#888]">Sem dados para o filtro.</p>
      ) : (
        <div className={adminTableWrap}>
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-[#0d0d0d]">
                <th className={adminTh}>#</th>
                <th className={adminTh}>Nome</th>
                <th className={adminTh}>Contato</th>
                <th className={adminTh}>Números</th>
                <th className={adminTh}>Total</th>
                <th className={adminTh}>Rifas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={`${r.position}-${r.telefone}`} className="hover:bg-white/[0.02]">
                  <td className={adminTd}>{r.position}</td>
                  <td className={adminTd}>{r.nome}</td>
                  <td className={adminTd}>
                    <span className="block text-xs text-[#888]">{r.telefone}</span>
                    <span className="text-xs">{r.email}</span>
                  </td>
                  <td className={adminTd}>{r.quantidadeNumeros}</td>
                  <td className={adminTd}>{r.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td className={`${adminTd} max-w-[240px] text-xs text-[#888]`}>{r.rifas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
