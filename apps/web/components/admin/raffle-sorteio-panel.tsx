"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { adminBtnSecondary, adminInput, adminLabel } from "./admin-styles";

export function RaffleSorteioPanel({
  raffleId,
  numeroPadding,
  currentWinnerNumero,
}: {
  raffleId: string;
  numeroPadding: number;
  currentWinnerNumero?: string | null;
}) {
  const router = useRouter();
  const [numero, setNumero] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function pad(n: string) {
    const t = n.replace(/\D/g, "");
    if (!t) return "";
    return t.padStart(numeroPadding, "0");
  }

  async function registrarVencedor() {
    const p = pad(numero);
    if (!p) {
      setMsg("Informe o número.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ items: { id: string; numero: string; status: string }[] }>(
        `/api/admin/numbers?raffleId=${encodeURIComponent(raffleId)}&q=${encodeURIComponent(p)}&pageSize=20`,
      );
      const exact = res.items.find((i) => i.numero === p);
      if (!exact) {
        setMsg("Número não encontrado nesta rifa.");
        return;
      }
      if (exact.status !== "PAID") {
        setMsg(`O número existe mas não está pago (status: ${exact.status}).`);
        return;
      }
      await adminFetch(`/api/admin/raffles/${raffleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroVencedorId: exact.id,
          sorteadoEm: new Date().toISOString(),
          status: "DRAWN",
        }),
      });
      setMsg("Resultado registrado (rifa como SORTEADA).");
      router.refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function encerrarSemSorteio() {
    if (!window.confirm("Encerrar a rifa sem registrar número vencedor agora?")) return;
    setLoading(true);
    try {
      await adminFetch(`/api/admin/raffles/${raffleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      router.refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#0d0d0d] p-6">
      <h3 className="font-display text-lg text-[#F2C94C]">Sorteio / resultado</h3>
      <p className="mt-1 text-xs text-[#888]">
        O número vencedor deve existir e estar com status PAID. Padding: {numeroPadding} dígitos.
      </p>
      {currentWinnerNumero && (
        <p className="mt-2 text-sm text-[#BDBDBD]">
          Número vencedor atual: <strong className="text-[#F2C94C]">{currentWinnerNumero}</strong>
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className={adminLabel}>
          Número (ex.: {pad("1") || "0001"})
          <input className={adminInput} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex.: 1 ou 0001" />
        </label>
        <button type="button" className={adminBtnSecondary} disabled={loading} onClick={() => void registrarVencedor()}>
          Registrar vencedor e marcar SORTEADA
        </button>
        <button type="button" className={adminBtnSecondary} disabled={loading} onClick={() => void encerrarSemSorteio()}>
          Só encerrar (CLOSED)
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-[#BDBDBD]">{msg}</p>}
    </div>
  );
}
