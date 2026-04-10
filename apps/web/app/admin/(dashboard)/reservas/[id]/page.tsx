"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminBtnSecondary, adminCard } from "@/components/admin/admin-styles";

type Detail = {
  id: string;
  codigo: string;
  status: string;
  quantidade: number;
  valorTotal: number;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  raffle: { id: string; titulo: string; slug: string };
  participant: { nome: string; telefone: string; email: string; cpf: string | null };
  numbers: { raffleNumber: { id: string; numero: string; status: string } }[];
  pixPayments: { id: string; statusInterno: string; txid: string | null; valor: number; externalPaymentId: string | null }[];
  whatsappMsgs: { id: string; statusEnvio: string; conteudo: string; erro: string | null; createdAt: string }[];
  webhooks: { id: string; status: string; topic: string | null; resourceId: string | null; lastError: string | null }[];
};

export default function AdminReservaDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [r, setR] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErr(null);
    try {
      const data = await adminFetch<Detail>(`/api/admin/reservations/${id}`);
      setR(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(name: "cancel" | "resync_pix" | "resend_whatsapp", pixId?: string) {
    setMsg(null);
    try {
      await adminFetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: name, ...(pixId ? { pixPaymentId: pixId } : {}) }),
      });
      setMsg("Ação concluída.");
      void load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  if (!id) return null;
  if (err && !r) return <p className="text-red-400">{err}</p>;
  if (!r) return <p className="text-[#888]">Carregando…</p>;

  const pix0 = r.pixPayments[0];

  return (
    <div>
      <AdminPageHeader
        title={`Reserva ${r.codigo}`}
        subtitle={`${r.raffle.titulo} · ${r.status}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Reservas", href: "/admin/reservas" },
          { label: r.codigo },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {r.status === "PENDING" && (
              <button type="button" className={adminBtnSecondary} onClick={() => void action("cancel")}>
                Cancelar reserva
              </button>
            )}
            {pix0 && (
              <button type="button" className={adminBtnSecondary} onClick={() => void action("resync_pix", pix0.id)}>
                Revalidar Pix
              </button>
            )}
            <button type="button" className={adminBtnSecondary} onClick={() => void action("resend_whatsapp")}>
              Reenviar WhatsApp
            </button>
          </div>
        }
      />
      {msg && <p className="mb-4 text-sm text-emerald-400">{msg}</p>}
      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={adminCard}>
          <h3 className="text-sm font-semibold text-[#D4AF37]">Participante</h3>
          <p className="mt-2 text-[#E0E0E0]">{r.participant.nome}</p>
          <p className="text-sm text-[#888]">{r.participant.telefone}</p>
          <p className="text-sm text-[#888]">{r.participant.email}</p>
        </div>
        <div className={adminCard}>
          <h3 className="text-sm font-semibold text-[#D4AF37]">Valores</h3>
          <p className="mt-2 text-[#F5F5F5]">
            {r.quantidade} números · {r.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-[#888]">Expira: {new Date(r.expiresAt).toLocaleString("pt-BR")}</p>
          {r.paidAt && <p className="text-xs text-[#888]">Pago: {new Date(r.paidAt).toLocaleString("pt-BR")}</p>}
        </div>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Números</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {r.numbers.map((n) => (
            <span key={n.raffleNumber.id} className="rounded border border-white/10 px-2 py-1 font-mono text-sm">
              {n.raffleNumber.numero} ({n.raffleNumber.status})
            </span>
          ))}
        </div>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Pagamentos Pix</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {r.pixPayments.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/pagamentos/${p.id}`} className="text-[#D4AF37] hover:underline">
                {p.statusInterno}
              </Link>{" "}
              · {p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · txid: {p.txid ?? "—"}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">WhatsApp</h3>
        <ul className="mt-3 space-y-2 text-xs text-[#BDBDBD]">
          {r.whatsappMsgs.map((w) => (
            <li key={w.id}>
              {w.statusEnvio} — {new Date(w.createdAt).toLocaleString("pt-BR")}
              {w.erro && <span className="block text-red-400">{w.erro}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Webhooks relacionados</h3>
        <ul className="mt-3 space-y-2 text-xs">
          {r.webhooks.map((w) => (
            <li key={w.id}>
              <Link href={`/admin/webhooks/${w.id}`} className="text-[#D4AF37] hover:underline">
                {w.id.slice(0, 8)}…
              </Link>{" "}
              {w.status} {w.topic && `· ${w.topic}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
