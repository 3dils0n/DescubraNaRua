"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminBtnSecondary, adminCard } from "@/components/admin/admin-styles";

type P = {
  id: string;
  provider: string;
  externalPaymentId: string | null;
  externalReference: string;
  txid: string | null;
  statusInterno: string;
  statusGateway: string | null;
  valor: number;
  rawResponseJson: unknown;
  integrationError: string | null;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  webhookReceivedAt: string | null;
  reservation: {
    id: string;
    codigo: string;
    valorTotal: number;
    raffle: { titulo: string };
    participant: { nome: string; telefone: string; email: string };
    numbers: { raffleNumber: { id: string; numero: string; status: string } }[];
  };
  webhooks: { id: string; status: string; topic: string | null; lastError: string | null }[];
};

export default function AdminPagamentoDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [p, setP] = useState<P | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErr(null);
    try {
      const data = await adminFetch<P>(`/api/admin/payments/${id}`);
      setP(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sync() {
    setMsg(null);
    try {
      await adminFetch(`/api/admin/payments/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      setMsg("Sincronizado com o gateway.");
      void load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  if (!id) return null;
  if (err && !p) return <p className="text-red-400">{err}</p>;
  if (!p) return <p className="text-[#888]">Carregando…</p>;

  return (
    <div>
      <AdminPageHeader
        title="Pagamento Pix"
        subtitle={`${p.statusInterno} · ${p.provider}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Pagamentos", href: "/admin/pagamentos" },
          { label: p.id.slice(0, 8) },
        ]}
        actions={
          <button type="button" className={adminBtnSecondary} onClick={() => void sync()}>
            Reconsultar no gateway
          </button>
        }
      />
      {msg && <p className="mb-4 text-emerald-400">{msg}</p>}
      {err && <p className="mb-4 text-red-400">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={adminCard}>
          <h3 className="text-sm font-semibold text-[#D4AF37]">Identificadores</h3>
          <dl className="mt-3 space-y-2 text-sm text-[#BDBDBD]">
            <div>
              <dt className="text-xs text-[#666]">external_payment_id</dt>
              <dd className="font-mono text-xs">{p.externalPaymentId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#666]">txid</dt>
              <dd className="font-mono text-xs">{p.txid ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#666]">reference</dt>
              <dd className="font-mono text-xs">{p.externalReference}</dd>
            </div>
          </dl>
        </div>
        <div className={adminCard}>
          <h3 className="text-sm font-semibold text-[#D4AF37]">Datas</h3>
          <p className="mt-2 text-sm text-[#BDBDBD]">Criado: {new Date(p.createdAt).toLocaleString("pt-BR")}</p>
          <p className="text-sm text-[#BDBDBD]">Expira: {new Date(p.expiresAt).toLocaleString("pt-BR")}</p>
          {p.paidAt && <p className="text-sm text-[#BDBDBD]">Pago: {new Date(p.paidAt).toLocaleString("pt-BR")}</p>}
          {p.webhookReceivedAt && (
            <p className="text-sm text-[#BDBDBD]">Webhook: {new Date(p.webhookReceivedAt).toLocaleString("pt-BR")}</p>
          )}
        </div>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Reserva</h3>
        <p className="mt-2">
          <Link href={`/admin/reservas/${p.reservation.id}`} className="text-[#D4AF37] hover:underline">
            {p.reservation.codigo}
          </Link>{" "}
          · {p.reservation.raffle.titulo}
        </p>
        <p className="text-sm text-[#888]">
          {p.reservation.participant.nome} — {p.reservation.participant.telefone}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.reservation.numbers.map((n) => (
            <span key={n.raffleNumber.id} className="rounded border border-white/10 px-2 py-0.5 font-mono text-sm">
              {n.raffleNumber.numero}
            </span>
          ))}
        </div>
      </div>

      {p.integrationError && (
        <div className={`${adminCard} mt-6 border-red-500/30`}>
          <h3 className="text-sm font-semibold text-red-400">Erro de integração</h3>
          <pre className="mt-2 overflow-x-auto text-xs text-red-200/90">{p.integrationError}</pre>
        </div>
      )}

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Payload bruto (gateway)</h3>
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-[#BDBDBD]">
          {JSON.stringify(p.rawResponseJson ?? {}, null, 2)}
        </pre>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Webhooks inbox</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {p.webhooks.map((w) => (
            <li key={w.id}>
              <Link href={`/admin/webhooks/${w.id}`} className="text-[#D4AF37] hover:underline">
                {w.id.slice(0, 12)}…
              </Link>{" "}
              {w.status} {w.topic && `· ${w.topic}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
