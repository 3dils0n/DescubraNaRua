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
  topic: string | null;
  resourceId: string | null;
  status: string;
  attempts: number;
  nextRetryAt: string | null;
  processedAt: string | null;
  createdAt: string;
  lastError: string | null;
};

export default function AdminWebhooksPage() {
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ status: "", topic: "", provider: "", resourceId: "", from: "", to: "" });
  const [data, setData] = useState<{ total: number; items: Row[]; pageSize: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
      Object.entries(f).forEach(([k, v]) => {
        if (v) qs.set(k === "topic" ? "topic" : k, v);
      });
      const res = await adminFetch<{ total: number; items: Row[]; pageSize: number }>(`/api/admin/webhooks?${qs}`);
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
      <AdminPageHeader
        title="Webhook inbox"
        subtitle="Fila de processamento — reenfileirar e reprocessar falhas"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Webhooks" }]}
      />
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabel}>
          Status
          <select className={adminInput} value={f.status} onChange={(e) => { setPage(1); setF((x) => ({ ...x, status: e.target.value })); }}>
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </label>
        <label className={adminLabel}>
          Provider
          <select className={adminInput} value={f.provider} onChange={(e) => { setPage(1); setF((x) => ({ ...x, provider: e.target.value })); }}>
            <option value="">Todos</option>
            <option value="MERCADOPAGO">MERCADOPAGO</option>
            <option value="MOCK">MOCK</option>
          </select>
        </label>
        {(
          [
            ["topic", "Topic (contém)"],
            ["resourceId", "Resource / payment id"],
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
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Status</th>
                  <th className={adminTh}>Provider</th>
                  <th className={adminTh}>Topic</th>
                  <th className={adminTh}>Resource</th>
                  <th className={adminTh}>Tentativas</th>
                  <th className={adminTh}>Criado</th>
                  <th className={adminTh}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>{w.status}</td>
                    <td className={adminTd}>{w.provider}</td>
                    <td className={`${adminTd} max-w-[160px] truncate`}>{w.topic ?? "—"}</td>
                    <td className={`${adminTd} max-w-[140px] truncate font-mono text-xs`}>{w.resourceId ?? "—"}</td>
                    <td className={adminTd}>{w.attempts}</td>
                    <td className={adminTd}>{new Date(w.createdAt).toLocaleString("pt-BR")}</td>
                    <td className={adminTd}>
                      <Link href={`/admin/webhooks/${w.id}`} className="text-[#D4AF37] hover:underline">
                        Abrir
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
