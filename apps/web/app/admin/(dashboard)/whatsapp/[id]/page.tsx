"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminBtnSecondary, adminCard } from "@/components/admin/admin-styles";

type M = {
  id: string;
  provider: string;
  telefone: string;
  tipoMensagem: string;
  conteudo: string;
  statusEnvio: string;
  tentativas: number;
  erro: string | null;
  providerMessageId: string | null;
  createdAt: string;
  sentAt: string | null;
  reservation: { id: string; codigo: string; raffle: { titulo: string } };
  participant: { nome: string; email: string };
};

export default function AdminWhatsappDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [m, setM] = useState<M | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErr(null);
    try {
      const data = await adminFetch<M>(`/api/admin/whatsapp/${id}`);
      setM(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(action: "retry" | "mark_skipped") {
    setMsg(null);
    try {
      await adminFetch(`/api/admin/whatsapp/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setMsg("OK");
      void load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  if (!id) return null;
  if (err && !m) return <p className="text-red-400">{err}</p>;
  if (!m) return <p className="text-[#888]">Carregando…</p>;

  return (
    <div>
      <AdminPageHeader
        title="Mensagem WhatsApp"
        subtitle={`${m.statusEnvio} · ${m.provider}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "WhatsApp", href: "/admin/whatsapp" },
          { label: m.id.slice(0, 8) },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={adminBtnSecondary} onClick={() => void post("retry")}>
              Reenviar / reprocessar
            </button>
            <button type="button" className={adminBtnSecondary} onClick={() => void post("mark_skipped")}>
              Marcar ignorada (SKIPPED)
            </button>
          </div>
        }
      />
      {msg && <p className="mb-4 text-emerald-400">{msg}</p>}
      {err && <p className="mb-4 text-red-400">{err}</p>}

      <div className={adminCard}>
        <p className="text-sm text-[#BDBDBD]">
          Reserva:{" "}
          <Link href={`/admin/reservas/${m.reservation.id}`} className="text-[#D4AF37] hover:underline">
            {m.reservation.codigo}
          </Link>{" "}
          · {m.reservation.raffle.titulo}
        </p>
        <p className="mt-2 text-sm text-[#888]">
          {m.participant.nome} — {m.telefone}
        </p>
        <p className="mt-2 text-xs text-[#666]">
          Enviado em: {m.sentAt ? new Date(m.sentAt).toLocaleString("pt-BR") : "—"} · provider msg id:{" "}
          {m.providerMessageId ?? "—"}
        </p>
      </div>

      {m.erro && (
        <div className={`${adminCard} mt-6 border-red-500/30`}>
          <h3 className="text-sm font-semibold text-red-400">Erro</h3>
          <pre className="mt-2 text-xs text-red-200/90">{m.erro}</pre>
        </div>
      )}

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Conteúdo</h3>
        <pre className="mt-3 whitespace-pre-wrap text-sm text-[#E0E0E0]">{m.conteudo}</pre>
      </div>
    </div>
  );
}
