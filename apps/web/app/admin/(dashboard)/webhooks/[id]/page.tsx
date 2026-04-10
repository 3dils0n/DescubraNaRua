"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminBtnSecondary, adminCard } from "@/components/admin/admin-styles";

type Row = {
  id: string;
  provider: string;
  topic: string | null;
  resourceId: string | null;
  payload: unknown;
  headersJson: unknown;
  status: string;
  attempts: number;
  lastError: string | null;
  nextRetryAt: string | null;
  processedAt: string | null;
  createdAt: string;
};

export default function AdminWebhookDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [w, setW] = useState<Row | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErr(null);
    try {
      const data = await adminFetch<Row>(`/api/admin/webhooks/${id}`);
      setW(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(action: string) {
    setMsg(null);
    try {
      await adminFetch(`/api/admin/webhooks/${id}`, {
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
  if (err && !w) return <p className="text-red-400">{err}</p>;
  if (!w) return <p className="text-[#888]">Carregando…</p>;

  return (
    <div>
      <AdminPageHeader
        title="Webhook"
        subtitle={`${w.provider} · ${w.status}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Webhooks", href: "/admin/webhooks" },
          { label: w.id.slice(0, 8) },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={adminBtnSecondary} onClick={() => void post("requeue")}>
              Reenfileirar
            </button>
            <button type="button" className={adminBtnSecondary} onClick={() => void post("reprocess_now")} disabled={!w.resourceId}>
              Reprocessar agora
            </button>
            <button type="button" className={adminBtnSecondary} onClick={() => void post("mark_ignored")}>
              Marcar ignorado
            </button>
          </div>
        }
      />
      {msg && <p className="mb-4 text-emerald-400">{msg}</p>}
      {err && <p className="mb-4 text-red-400">{err}</p>}

      <div className={adminCard}>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs text-[#666]">resourceId</dt>
            <dd className="font-mono text-xs break-all">{w.resourceId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#666]">Tentativas / próximo retry</dt>
            <dd className="text-[#BDBDBD]">
              {w.attempts} · {w.nextRetryAt ? new Date(w.nextRetryAt).toLocaleString("pt-BR") : "—"}
            </dd>
          </div>
        </dl>
        {w.resourceId && (
          <p className="mt-4 text-xs text-[#888]">
            Buscar pagamento por external id:{" "}
            <Link href={`/admin/pagamentos?externalPaymentId=${encodeURIComponent(w.resourceId)}`} className="text-[#D4AF37] hover:underline">
              listagem filtrada
            </Link>
          </p>
        )}
      </div>

      {w.lastError && (
        <div className={`${adminCard} mt-6 border-red-500/20`}>
          <h3 className="text-sm font-semibold text-red-400">Último erro</h3>
          <pre className="mt-2 overflow-x-auto text-xs text-red-200/90">{w.lastError}</pre>
        </div>
      )}

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Payload</h3>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-black/40 p-3 text-xs">{JSON.stringify(w.payload, null, 2)}</pre>
      </div>

      <div className={`${adminCard} mt-6`}>
        <h3 className="text-sm font-semibold text-[#D4AF37]">Headers</h3>
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-black/40 p-3 text-xs">
          {JSON.stringify(w.headersJson ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
