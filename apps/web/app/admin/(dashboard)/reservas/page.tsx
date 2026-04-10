"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminTableWrap, adminTh, adminTd, adminInput, adminLabel, adminBtnSecondary } from "@/components/admin/admin-styles";

type Row = {
  id: string;
  codigo: string;
  status: string;
  quantidade: number;
  valorTotal: number;
  expiresAt: string;
  createdAt: string;
  raffle: { titulo: string };
  participant: { nome: string; telefone: string; email: string };
  pix: { statusInterno: string; txid: string | null } | null;
};

export default function AdminReservasPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    raffleId: "",
    status: "",
    codigo: "",
    nome: "",
    telefone: "",
    email: "",
    txid: "",
    from: "",
    to: "",
  });
  const [data, setData] = useState<{ total: number; items: Row[]; pageSize: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
      Object.entries(filters).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const res = await adminFetch<{ total: number; items: Row[]; pageSize: number }>(`/api/admin/reservations?${qs}`);
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [page, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Reservas" subtitle="Filtros e ações na linha de detalhe" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reservas" }]} />
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["raffleId", "ID rifa"],
            ["codigo", "Código"],
            ["nome", "Nome"],
            ["telefone", "Telefone"],
            ["email", "Email"],
            ["txid", "TxID / ext. id"],
            ["status", "Status"],
            ["from", "De (ISO)"],
            ["to", "Até (ISO)"],
          ] as const
        ).map(([k, ph]) => (
          <label key={k} className={adminLabel}>
            {ph}
            {k === "status" ? (
              <select className={adminInput} value={filters.status} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}>
                <option value="">Todos</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            ) : (
              <input
                className={adminInput}
                value={filters[k as keyof typeof filters]}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, [k]: e.target.value }));
                }}
                placeholder={ph}
              />
            )}
          </label>
        ))}
        <div className="flex items-end">
          <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
            Buscar
          </button>
        </div>
      </div>
      {err && <p className="mb-4 text-red-400">{err}</p>}
      {!data ? (
        <p className="text-[#888]">Carregando…</p>
      ) : (
        <>
          <div className={adminTableWrap}>
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Código</th>
                  <th className={adminTh}>Rifa</th>
                  <th className={adminTh}>Participante</th>
                  <th className={adminTh}>Qtd / Valor</th>
                  <th className={adminTh}>Status</th>
                  <th className={adminTh}>Pix</th>
                  <th className={adminTh}>Criada</th>
                  <th className={adminTh}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={`${adminTd} font-mono text-[#F2C94C]`}>{r.codigo}</td>
                    <td className={adminTd}>{r.raffle.titulo}</td>
                    <td className={adminTd}>
                      {r.participant.nome}
                      <span className="block text-xs text-[#888]">{r.participant.telefone}</span>
                    </td>
                    <td className={adminTd}>
                      {r.quantidade} · {r.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className={adminTd}>{r.status}</td>
                    <td className={adminTd}>{r.pix?.statusInterno ?? "—"}</td>
                    <td className={adminTd}>{new Date(r.createdAt).toLocaleString("pt-BR")}</td>
                    <td className={adminTd}>
                      <Link href={`/admin/reservas/${r.id}`} className="text-[#D4AF37] hover:underline">
                        Detalhe
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
