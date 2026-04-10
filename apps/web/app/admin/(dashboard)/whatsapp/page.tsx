"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminTableWrap, adminTh, adminTd, adminInput, adminLabel, adminBtnSecondary } from "@/components/admin/admin-styles";

type Row = {
  id: string;
  telefone: string;
  tipoMensagem: string;
  statusEnvio: string;
  tentativas: number;
  erro: string | null;
  createdAt: string;
  sentAt: string | null;
  providerMessageId: string | null;
  reservation: { codigo: string; raffle: { titulo: string } };
  participant: { nome: string };
};

export default function AdminWhatsappPage() {
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ statusEnvio: "", raffleId: "", nome: "", from: "", to: "" });
  const [data, setData] = useState<{ total: number; items: Row[]; pageSize: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
      Object.entries(f).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const res = await adminFetch<{ total: number; items: Row[]; pageSize: number }>(`/api/admin/whatsapp?${qs}`);
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
      <AdminPageHeader title="WhatsApp" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "WhatsApp" }]} />
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabel}>
          Status
          <select className={adminInput} value={f.statusEnvio} onChange={(e) => { setPage(1); setF((x) => ({ ...x, statusEnvio: e.target.value })); }}>
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
            <option value="SKIPPED">SKIPPED</option>
          </select>
        </label>
        <label className={adminLabel}>
          ID rifa
          <input
            className={adminInput}
            value={f.raffleId}
            onChange={(e) => {
              setPage(1);
              setF((x) => ({ ...x, raffleId: e.target.value }));
            }}
          />
        </label>
        <label className={adminLabel}>
          Nome participante
          <input
            className={adminInput}
            value={f.nome}
            onChange={(e) => {
              setPage(1);
              setF((x) => ({ ...x, nome: e.target.value }));
            }}
          />
        </label>
        <label className={adminLabel}>
          De (ISO)
          <input
            className={adminInput}
            value={f.from}
            onChange={(e) => {
              setPage(1);
              setF((x) => ({ ...x, from: e.target.value }));
            }}
            placeholder="2026-01-01T00:00:00.000Z"
          />
        </label>
        <label className={adminLabel}>
          Até (ISO)
          <input
            className={adminInput}
            value={f.to}
            onChange={(e) => {
              setPage(1);
              setF((x) => ({ ...x, to: e.target.value }));
            }}
            placeholder="2026-12-31T23:59:59.999Z"
          />
        </label>
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
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Status</th>
                  <th className={adminTh}>Tipo</th>
                  <th className={adminTh}>Participante</th>
                  <th className={adminTh}>Telefone</th>
                  <th className={adminTh}>Reserva</th>
                  <th className={adminTh}>Criado</th>
                  <th className={adminTh}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>{m.statusEnvio}</td>
                    <td className={adminTd}>{m.tipoMensagem}</td>
                    <td className={adminTd}>{m.participant.nome}</td>
                    <td className={`${adminTd} font-mono text-xs`}>{m.telefone}</td>
                    <td className={adminTd}>{m.reservation.codigo}</td>
                    <td className={adminTd}>{new Date(m.createdAt).toLocaleString("pt-BR")}</td>
                    <td className={adminTd}>
                      <Link href={`/admin/whatsapp/${m.id}`} className="text-[#D4AF37] hover:underline">
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
