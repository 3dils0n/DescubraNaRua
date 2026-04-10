"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminTableWrap, adminTh, adminTd, adminInput, adminLabel, adminBtnSecondary } from "@/components/admin/admin-styles";

type Row = {
  id: string;
  provider: string;
  externalPaymentId: string | null;
  txid: string | null;
  statusInterno: string;
  statusGateway: string | null;
  valor: number;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  reservation: { codigo: string; participant: { nome: string } };
};

export default function AdminPagamentosPage() {
  const [page, setPage] = useState(1);
  const [f, setF] = useState({
    statusInterno: "",
    statusGateway: "",
    codigo: "",
    txid: "",
    externalPaymentId: "",
    reservationId: "",
    from: "",
    to: "",
  });
  const [data, setData] = useState<{ total: number; items: Row[]; pageSize: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
      Object.entries(f).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const res = await adminFetch<{ total: number; items: Row[]; pageSize: number }>(`/api/admin/payments?${qs}`);
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [page, f]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Pagamentos Pix" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Pagamentos" }]} />
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabel}>
          Status interno
          <select className={adminInput} value={f.statusInterno} onChange={(e) => { setPage(1); setF((x) => ({ ...x, statusInterno: e.target.value })); }}>
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        {(
          [
            ["statusGateway", "Gateway status (contém)"],
            ["codigo", "Código reserva"],
            ["txid", "TxID"],
            ["externalPaymentId", "External payment id"],
            ["reservationId", "ID reserva"],
            ["from", "De (ISO)"],
            ["to", "Até (ISO)"],
          ] as const
        ).map(([k, ph]) => (
          <label key={k} className={adminLabel}>
            {ph}
            <input
              className={adminInput}
              value={f[k as keyof typeof f]}
              onChange={(e) => {
                setPage(1);
                setF((x) => ({ ...x, [k]: e.target.value }));
              }}
            />
          </label>
        ))}
        <div className="flex items-end">
          <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
            Buscar
          </button>
        </div>
      </div>
      {err && <p className="text-red-400">{err}</p>}
      {!data ? (
        <p className="text-[#888]">Carregando…</p>
      ) : (
        <>
          <div className={adminTableWrap}>
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Interno</th>
                  <th className={adminTh}>Gateway</th>
                  <th className={adminTh}>Valor</th>
                  <th className={adminTh}>Reserva</th>
                  <th className={adminTh}>TxID</th>
                  <th className={adminTh}>Criado</th>
                  <th className={adminTh}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>{p.statusInterno}</td>
                    <td className={`${adminTd} max-w-[120px] truncate`}>{p.statusGateway ?? "—"}</td>
                    <td className={adminTd}>{p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className={adminTd}>
                      {p.reservation.codigo}
                      <span className="block text-xs text-[#888]">{p.reservation.participant.nome}</span>
                    </td>
                    <td className={`${adminTd} max-w-[140px] truncate font-mono text-xs`}>{p.txid ?? "—"}</td>
                    <td className={adminTd}>{new Date(p.createdAt).toLocaleString("pt-BR")}</td>
                    <td className={adminTd}>
                      <Link href={`/admin/pagamentos/${p.id}`} className="text-[#D4AF37] hover:underline">
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
