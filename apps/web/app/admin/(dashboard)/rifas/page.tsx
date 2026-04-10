"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminTableWrap, adminTh, adminTd } from "@/components/admin/admin-styles";
import { GoldButton } from "@/components/gold-button";

type Row = {
  id: string;
  titulo: string;
  status: string;
  valorNumero: number;
  quantidadeTotal: number;
  dataSorteio: string;
  modoSelecaoNumeros: string;
  sold: number;
  reserved: number;
  available: number;
  blocked: number;
};

export default function AdminRifasPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: Row[]; pageSize: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await adminFetch<{ total: number; items: Row[]; pageSize: number }>(
        `/api/admin/raffles?page=${page}&pageSize=20`,
      );
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Rifas"
        subtitle="CRUD e visão operacional de cada campanha"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Rifas" }]}
        actions={<GoldButton href="/admin/rifas/new">Nova rifa</GoldButton>}
      />
      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}
      {!data ? (
        <p className="text-[#888]">Carregando…</p>
      ) : data.total === 0 ? (
        <p className="text-[#888]">Nenhuma rifa cadastrada.</p>
      ) : (
        <>
          <div className={adminTableWrap}>
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Título</th>
                  <th className={adminTh}>Status</th>
                  <th className={adminTh}>Valor</th>
                  <th className={adminTh}>Total / Vend. / Disp.</th>
                  <th className={adminTh}>Sorteio</th>
                  <th className={adminTh}>Modo</th>
                  <th className={adminTh}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={adminTd}>
                      <span className="font-medium text-[#F5F5F5]">{r.titulo}</span>
                    </td>
                    <td className={adminTd}>
                      <span className="rounded border border-white/10 px-2 py-0.5 text-xs">{r.status}</span>
                    </td>
                    <td className={adminTd}>
                      {r.valorNumero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className={adminTd}>
                      {r.quantidadeTotal} / {r.sold} / {r.available}
                    </td>
                    <td className={adminTd}>{new Date(r.dataSorteio).toLocaleString("pt-BR")}</td>
                    <td className={adminTd}>{r.modoSelecaoNumeros}</td>
                    <td className={adminTd}>
                      <Link href={`/admin/rifas/${r.id}`} className="text-[#D4AF37] hover:underline">
                        Editar
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
