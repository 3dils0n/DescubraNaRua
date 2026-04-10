"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminTableWrap, adminTh, adminTd, adminBtnSecondary } from "@/components/admin/admin-styles";

type Row = {
  id: string;
  titulo: string;
  status: string;
  dataSorteio: string;
  modoSelecaoNumeros: string;
  sold: number;
  quantidadeTotal: number;
};

export default function AdminSorteiosPage() {
  const [data, setData] = useState<{ items: Row[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await adminFetch<{ items: Row[]; total: number }>("/api/admin/raffles?pageSize=100&page=1");
      setData({ items: res.items });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Sorteios"
        subtitle="Visão rápida — registro de vencedor e encerramento na edição da rifa"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Sorteios" }]}
        actions={
          <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
            Atualizar
          </button>
        }
      />
      {err && <p className="text-red-400">{err}</p>}
      {!data ? (
        <p className="text-[#888]">Carregando…</p>
      ) : (
        <div className={adminTableWrap}>
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-[#0d0d0d]">
                <th className={adminTh}>Rifa</th>
                <th className={adminTh}>Status</th>
                <th className={adminTh}>Data sorteio</th>
                <th className={adminTh}>Vendidos / total</th>
                <th className={adminTh}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className={adminTd}>{r.titulo}</td>
                  <td className={adminTd}>{r.status}</td>
                  <td className={adminTd}>{new Date(r.dataSorteio).toLocaleString("pt-BR")}</td>
                  <td className={adminTd}>
                    {r.sold} / {r.quantidadeTotal}
                  </td>
                  <td className={adminTd}>
                    <Link href={`/admin/rifas/${r.id}`} className="text-[#D4AF37] hover:underline">
                      Abrir rifa e sorteio
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
