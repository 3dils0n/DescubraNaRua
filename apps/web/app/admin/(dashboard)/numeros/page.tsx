"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminTableWrap, adminTh, adminTd, adminBtnSecondary, adminInput, adminLabel } from "@/components/admin/admin-styles";

type Item = {
  id: string;
  numero: string;
  status: string;
  blockedReason: string | null;
  reservationNums: {
    reservation: {
      id: string;
      codigo: string;
      status: string;
      participant: { nome: string; telefone: string; email: string };
    };
  }[];
};

function NumerosInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const raffleId = sp.get("raffleId") ?? "";
  const [ridInput, setRidInput] = useState(raffleId);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: Item[]; pageSize: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!raffleId) {
      setData(null);
      return;
    }
    setErr(null);
    try {
      const qs = new URLSearchParams({ raffleId, page: String(page), pageSize: "50" });
      if (status) qs.set("status", status);
      if (q.trim()) qs.set("q", q.trim());
      const res = await adminFetch<{ total: number; items: Item[]; pageSize: number }>(`/api/admin/numbers?${qs}`);
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [raffleId, page, status, q]);

  useEffect(() => {
    setRidInput(raffleId);
  }, [raffleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function block(id: string) {
    const reason = window.prompt("Motivo do bloqueio?", "Bloqueio manual");
    if (reason === null) return;
    try {
      await adminFetch(`/api/admin/numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block", blockedReason: reason }),
      });
      void load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function unblock(id: string) {
    try {
      await adminFetch(`/api/admin/numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock" }),
      });
      void load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Números"
        subtitle="Consulta e bloqueio manual — informe a rifa na URL (?raffleId=)"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Números" }]}
      />
      <div className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-[#101010] p-4">
        <label className={adminLabel}>
          ID da rifa (obrigatório)
          <input
            className={adminInput}
            value={ridInput}
            onChange={(e) => setRidInput(e.target.value)}
            placeholder="Cole o ID da rifa"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className={adminBtnSecondary}
            onClick={() => router.push(`/admin/numeros?raffleId=${encodeURIComponent(ridInput.trim())}`)}
          >
            Carregar rifa
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className={adminLabel}>
            Status
            <select className={adminInput} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">Todos</option>
              <option value="AVAILABLE">Disponível</option>
              <option value="RESERVED">Reservado</option>
              <option value="PAID">Pago</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </label>
          <label className={adminLabel}>
            Buscar número
            <input className={adminInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: 0042" />
          </label>
          <div className="flex items-end">
            <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
              Aplicar
            </button>
          </div>
        </div>
      </div>
      {!raffleId && <p className="text-[#888]">Defina <code className="text-[#D4AF37]">?raffleId=</code> na URL (abra uma rifa e use &quot;Ver números&quot;).</p>}
      {err && <p className="text-red-400">{err}</p>}
      {raffleId && !data && !err && <p className="text-[#888]">Carregando…</p>}
      {data && (
        <>
          <div className={adminTableWrap}>
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#0d0d0d]">
                  <th className={adminTh}>Número</th>
                  <th className={adminTh}>Status</th>
                  <th className={adminTh}>Reserva / participante</th>
                  <th className={adminTh}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`${adminTd} text-center text-[#888]`}>
                      Nenhum resultado
                    </td>
                  </tr>
                ) : (
                  data.items.map((row) => {
                    const rn = row.reservationNums[0]?.reservation;
                    return (
                      <tr key={row.id} className="hover:bg-white/[0.02]">
                        <td className={adminTd}>
                          <span className="font-mono text-[#F2C94C]">{row.numero}</span>
                        </td>
                        <td className={adminTd}>
                          {row.status}
                          {row.blockedReason && <span className="ml-2 text-xs text-[#888]">({row.blockedReason})</span>}
                        </td>
                        <td className={adminTd}>
                          {rn ? (
                            <>
                              <Link href={`/admin/reservas/${rn.id}`} className="text-[#D4AF37] hover:underline">
                                {rn.codigo}
                              </Link>
                              <span className="block text-xs text-[#888]">{rn.participant.nome}</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className={adminTd}>
                          {row.status === "BLOCKED" ? (
                            <button type="button" className={adminBtnSecondary} onClick={() => void unblock(row.id)}>
                              Liberar
                            </button>
                          ) : (
                            <button type="button" className={adminBtnSecondary} onClick={() => void block(row.id)}>
                              Bloquear
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default function AdminNumerosPage() {
  return (
    <Suspense fallback={<p className="text-[#888]">Carregando…</p>}>
      <NumerosInner />
    </Suspense>
  );
}
