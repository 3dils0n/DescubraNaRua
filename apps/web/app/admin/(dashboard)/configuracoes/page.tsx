"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminCard, adminInput, adminLabel, adminBtnSecondary } from "@/components/admin/admin-styles";
import { GoldButton } from "@/components/gold-button";

type Cfg = {
  pixProvider: string;
  whatsappProvider: string;
  appBaseUrl: string;
  nextPublicAppUrl: string;
  nextauthUrl: string;
  reservaExpiraMinutosPadrao: number;
  rankingCacheTtlSeconds: number;
  recentPurchasesWindowMinutes: number;
  auth: {
    nextauthSecretConfigured: boolean;
    jwtSecretConfigured: boolean;
    adminJwtReady: boolean;
  };
  internal: {
    internalApiKeyConfigured: boolean;
    cronSecretConfigured: boolean;
  };
  pix: {
    mercadoPagoAccessTokenConfigured: boolean;
    mercadoPagoWebhookSecretConfigured: boolean;
    legacyMpAccessTokenAlias: boolean;
    legacyMpWebhookSecretAlias: boolean;
  };
  whatsapp: {
    tokenConfigured: boolean;
    metaPhoneIdConfigured: boolean;
    instanceUrl: string;
    webhookSecretConfigured: boolean;
  };
};

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-[#888]"
      }`}
    >
      {label}
    </span>
  );
}

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-mono text-xs text-[#888]">{name}</span>
      <div className="text-sm text-[#E0E0E0]">{children}</div>
    </div>
  );
}

const ERR_MAP: Record<string, string> = {
  SENHA_ATUAL_INVALIDA: "Senha atual incorreta.",
  SENHA_IGUAL: "A nova senha deve ser diferente da atual.",
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
};

function AdminChangePasswordSection() {
  const [email, setEmail] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const me = await adminFetch<{ email: string }>("/api/admin/me");
        setEmail(me.email);
      } catch {
        setEmail(null);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (next !== confirm) {
      setErr("A confirmação da nova senha não confere.");
      return;
    }
    setLoading(true);
    try {
      await adminFetch<{ ok: boolean }>("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setMsg("Senha alterada com sucesso.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : "";
      setErr(ERR_MAP[code] ?? (e instanceof Error ? e.message : "Erro ao alterar senha."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${adminCard} mb-8`}>
      <h3 className="text-sm font-semibold text-[#D4AF37]">Conta do administrador</h3>
      <p className="mt-1 text-xs text-[#666]">
        {email ? (
          <>
            Utilizador: <span className="text-[#BDBDBD]">{email}</span>
          </>
        ) : (
          "—"
        )}
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-4 max-w-md space-y-4">
        <label className={adminLabel}>
          Senha atual
          <input
            type="password"
            autoComplete="current-password"
            className={adminInput}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </label>
        <label className={adminLabel}>
          Nova senha (mín. 8 caracteres)
          <input
            type="password"
            autoComplete="new-password"
            className={adminInput}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className={adminLabel}>
          Confirmar nova senha
          <input
            type="password"
            autoComplete="new-password"
            className={adminInput}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </label>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        <div className="flex flex-wrap gap-3">
          <GoldButton type="submit" disabled={loading}>
            {loading ? "A guardar…" : "Alterar senha"}
          </GoldButton>
          <button type="button" className={adminBtnSecondary} onClick={() => { setCurrent(""); setNext(""); setConfirm(""); setErr(null); setMsg(null); }}>
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}

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
        subtitle="Leitura do ambiente em tempo de execução (mesmo bloco do .env). Valores secretos não são exibidos — só se estão definidos."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Configurações" }]}
      />
      <AdminChangePasswordSection />
      {err && <p className="text-red-400">{err}</p>}
      {!c ? (
        <p className="text-[#888]">Carregando variáveis de ambiente…</p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-[#888]">
            Para alterar: edite o <code className="text-[#D4AF37]">.env</code> na raiz do monorepo (ou variáveis no painel do host) e faça redeploy / reinicie o processo.
          </p>

          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">URLs da app</h3>
            <div className="mt-2">
              <Row name="APP_BASE_URL">
                {c.appBaseUrl || <span className="text-[#666]">—</span>}
              </Row>
              <Row name="NEXT_PUBLIC_APP_URL">
                {c.nextPublicAppUrl || <span className="text-[#666]">—</span>}
              </Row>
              <Row name="NEXTAUTH_URL">
                {c.nextauthUrl || <span className="text-[#666]">—</span>}
              </Row>
            </div>
          </div>

          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">Admin JWT (NEXTAUTH_SECRET / JWT_SECRET)</h3>
            <p className="mt-1 text-xs text-[#666]">O login do admin usa um destes segredos (mín. 16 caracteres).</p>
            <div className="mt-2">
              <Row name="NEXTAUTH_SECRET">
                <Badge ok={c.auth.nextauthSecretConfigured} label={c.auth.nextauthSecretConfigured ? "Definido" : "Vazio"} />
              </Row>
              <Row name="JWT_SECRET">
                <Badge ok={c.auth.jwtSecretConfigured} label={c.auth.jwtSecretConfigured ? "Definido" : "Vazio"} />
              </Row>
              <Row name="Login admin operacional">
                <Badge ok={c.auth.adminJwtReady} label={c.auth.adminJwtReady ? "Sim (≥16 chars)" : "Não"} />
              </Row>
            </div>
          </div>

          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">API interna (cron / rotas protegidas)</h3>
            <div className="mt-2">
              <Row name="INTERNAL_API_KEY">
                <Badge ok={c.internal.internalApiKeyConfigured} label={c.internal.internalApiKeyConfigured ? "Definido" : "Vazio"} />
              </Row>
              <Row name="CRON_SECRET">
                <Badge ok={c.internal.cronSecretConfigured} label={c.internal.cronSecretConfigured ? "Definido" : "Vazio"} />
              </Row>
            </div>
          </div>

          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">Pix (Mercado Pago)</h3>
            <div className="mt-2">
              <Row name="PIX_PROVIDER">
                <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-sm">{c.pixProvider}</span>
              </Row>
              <Row name="MERCADO_PAGO_ACCESS_TOKEN">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge
                    ok={c.pix.mercadoPagoAccessTokenConfigured}
                    label={c.pix.mercadoPagoAccessTokenConfigured ? "Definido" : "Vazio"}
                  />
                  {c.pix.legacyMpAccessTokenAlias && (
                    <span className="text-xs text-[#888]">(via MP_ACCESS_TOKEN)</span>
                  )}
                </span>
              </Row>
              <Row name="MERCADO_PAGO_WEBHOOK_SECRET">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge
                    ok={c.pix.mercadoPagoWebhookSecretConfigured}
                    label={c.pix.mercadoPagoWebhookSecretConfigured ? "Definido" : "Vazio"}
                  />
                  {c.pix.legacyMpWebhookSecretAlias && (
                    <span className="text-xs text-[#888]">(via MP_WEBHOOK_SECRET)</span>
                  )}
                </span>
              </Row>
            </div>
          </div>

          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">WhatsApp</h3>
            <div className="mt-2">
              <Row name="WHATSAPP_PROVIDER">
                <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-sm">{c.whatsappProvider}</span>
              </Row>
              <Row name="WHATSAPP_TOKEN">
                <Badge ok={c.whatsapp.tokenConfigured} label={c.whatsapp.tokenConfigured ? "Definido" : "Vazio"} />
              </Row>
              <Row name="WHATSAPP_META_PHONE_ID">
                <Badge ok={c.whatsapp.metaPhoneIdConfigured} label={c.whatsapp.metaPhoneIdConfigured ? "Definido" : "Vazio"} />
              </Row>
              <Row name="WHATSAPP_INSTANCE_URL">
                {c.whatsapp.instanceUrl ? (
                  <span className="break-all text-[#BDBDBD]">{c.whatsapp.instanceUrl}</span>
                ) : (
                  <span className="text-[#666]">—</span>
                )}
              </Row>
              <Row name="WHATSAPP_WEBHOOK_SECRET">
                <Badge
                  ok={c.whatsapp.webhookSecretConfigured}
                  label={c.whatsapp.webhookSecretConfigured ? "Definido" : "Vazio"}
                />
              </Row>
            </div>
          </div>

          <div className={adminCard}>
            <h3 className="text-sm font-semibold text-[#D4AF37]">Regras de negócio (opcional)</h3>
            <p className="mt-1 text-xs text-[#666]">
              Valores efetivos após fallback (ver <code className="text-[#888]">packages/shared/src/constants.ts</code>).
            </p>
            <div className="mt-2">
              <Row name="RESERVATION_EXPIRATION_MINUTES">
                {c.reservaExpiraMinutosPadrao} min
              </Row>
              <Row name="RANKING_CACHE_TTL_SECONDS">{c.rankingCacheTtlSeconds} s</Row>
              <Row name="RECENT_PURCHASES_WINDOW_MINUTES">{c.recentPurchasesWindowMinutes} min</Row>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
