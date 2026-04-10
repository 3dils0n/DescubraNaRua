"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminCard } from "@/components/admin/admin-styles";

type Cfg = {
  pixProvider: string;
  whatsappProvider: string;
  appBaseUrl: string;
  reservaExpiraMinutosPadrao: number;
};

export default function AdminConfiguracoesPage() {
  const [c, setC] = useState<Cfg | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Cfg>("/api/admin/config");
        setC(data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Configurações"
        subtitle="Valores efetivos via ambiente (runtime). Ajuste fino por rifa permanece na edição da campanha."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Configurações" }]}
      />
      {err && <p className="text-red-400">{err}</p>}
      {!c ? (
        <p className="text-[#888]">Carregando…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">Providers</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#666]">Pix</dt>
                <dd className="text-[#E0E0E0]">{c.pixProvider}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#666]">WhatsApp</dt>
                <dd className="text-[#E0E0E0]">{c.whatsappProvider}</dd>
              </div>
            </dl>
          </div>
          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">App</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#666]">URL base</dt>
                <dd className="break-all text-[#BDBDBD]">{c.appBaseUrl || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#666]">Reserva expira (min) — referência</dt>
                <dd className="text-[#E0E0E0]">{c.reservaExpiraMinutosPadrao}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
