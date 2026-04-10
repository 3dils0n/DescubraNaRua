"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminTableWrap, adminTh, adminTd, adminInput, adminLabel, adminBtnSecondary } from "@/components/admin/admin-styles";

type LogRow = {
  id: string;
  context: string;
  provider: string | null;
  message: string;
  metadata: unknown;
  createdAt: string;
};

type Health = {
  webhooksFailed: number;
  whatsappFailed: number;
  pixInconsistent: number;
  reservationsExpired: number;
};

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [ctx, setCtx] = useState("");
  const [data, setData] = useState<{ total: number; items: LogRow[]; pageSize: number; health: Health } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "30" });
      if (ctx.trim()) qs.set("context", ctx.trim());
      const res = await adminFetch<{ total: number; items: LogRow[]; pageSize: number; health: Health }>(`/api/admin/logs?${qs}`);
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [page, ctx]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Logs e monitoramento"
        subtitle="Logs de integração + indicadores de saúde operacional"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Logs" }]}
      />

      {data && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Webhooks FAILED", data.health.webhooksFailed],
              ["WhatsApp FAILED", data.health.whatsappFailed],
              ["Pix inconsistente*", data.health.pixInconsistent],
              ["Reservas EXPIRED", data.health.reservationsExpired],
            ] as const
          ).map(([label, val]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#D4AF37]/20 bg-[#101010] px-4 py-4 shadow-[0_0_20px_rgba(212,175,55,0.06)]"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#888]">{label}</p>
              <p className="mt-2 font-display text-2xl text-[#F2C94C]">{val}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mb-6 text-xs text-[#666]">
        *Pix aprovado no gateway mas reserva ainda não marcada como paga — investigar fila e webhooks.
      </p>

      <div className="mb-6 flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-[#101010] p-4">
        <label className={adminLabel}>
          Contexto (contém)
          <input className={adminInput} value={ctx} onChange={(e) => { setPage(1); setCtx(e.target.value); }} />
        </label>
        <div className="flex items-end">
          <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
            Filtrar
          </button>
        </div>
      </div>
      {err && <p className="text-red-400">{err}</p>}
      {!data ? (
        <p className="text-[#888]">Carregando…</p>
      ) : (
        <>
          <div className={adminTableWrap}>
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Quando</th>
                  <th className={adminTh}>Contexto</th>
                  <th className={adminTh}>Provider</th>
                  <th className={adminTh}>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={`${adminTd} whitespace-nowrap text-xs`}>{new Date(r.createdAt).toLocaleString("pt-BR")}</td>
                    <td className={adminTd}>{r.context}</td>
                    <td className={adminTd}>{r.provider ?? "—"}</td>
                    <td className={`${adminTd} max-w-[480px]`}>
                      <span className="line-clamp-3 text-xs">{r.message}</span>
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
