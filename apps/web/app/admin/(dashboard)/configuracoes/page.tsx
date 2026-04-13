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
    effectiveProvider: string;
    effectiveAccessTokenConfigured: boolean;
    effectiveWebhookSecretConfigured: boolean;
    /** false = tabela app_settings em falta; formulário no painel desativado */
    settingsTableAvailable?: boolean;
    database: {
      pixProviderOverride: "MERCADOPAGO" | "MOCK" | null;
      hasAccessTokenInDatabase: boolean;
      hasWebhookSecretInDatabase: boolean;
    };
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

function pixModeFromCfg(c: Cfg): "inherit" | "mock" | "mercadopago" {
  const o = c.pix.database?.pixProviderOverride ?? null;
  if (o === null) return "inherit";
  return o === "MERCADOPAGO" ? "mercadopago" : "mock";
}

function AdminPixSection({ c, onSaved }: { c: Cfg; onSaved: () => void }) {
  const [pixProviderMode, setPixProviderMode] = useState<"inherit" | "mock" | "mercadopago">(() =>
    pixModeFromCfg(c),
  );
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [accessTouched, setAccessTouched] = useState(false);
  const [webhookTouched, setWebhookTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState<"access" | "webhook" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setPixProviderMode(pixModeFromCfg(c));
    setAccessToken("");
    setWebhookSecret("");
    setAccessTouched(false);
    setWebhookTouched(false);
  }, [c]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = { pixProviderMode };
      if (accessTouched) body.mercadoPagoAccessToken = accessToken;
      if (webhookTouched) body.mercadoPagoWebhookSecret = webhookSecret;
      await adminFetch("/api/admin/config/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMsg("Configuração Pix guardada.");
      setAccessToken("");
      setWebhookSecret("");
      setAccessTouched(false);
      setWebhookTouched(false);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar.");
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || clearing !== null;
  const tableOk = c.pix.settingsTableAvailable !== false;

  async function clearPanelToken(which: "access" | "webhook") {
    setMsg(null);
    setErr(null);
    setClearing(which);
    try {
      await adminFetch("/api/admin/config/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixProviderMode,
          ...(which === "access" ? { clearMercadoPagoAccessToken: true } : { clearMercadoPagoWebhookSecret: true }),
        }),
      });
      setMsg(
        which === "access"
          ? "Access token removido do painel. Passa a usar o .env (se existir)."
          : "Segredo do webhook removido do painel. Passa a usar o .env (se existir).",
      );
      setAccessToken("");
      setWebhookSecret("");
      setAccessTouched(false);
      setWebhookTouched(false);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao remover.");
    } finally {
      setClearing(null);
    }
  }

  return (
    <div id="admin-pix-config" className={`${adminCard} mb-8 ring-1 ring-[#D4AF37]/25`}>
      <h3 className="text-base font-semibold text-[#D4AF37]">Configurar Pix (Mercado Pago)</h3>
      <p className="mt-1 text-xs text-[#888]">
        Aqui defines o modo (mock / Mercado Pago) e os tokens guardados na base. Provider efetivo:{" "}
        <span className="font-mono text-[#D4AF37]">{c.pix.effectiveProvider ?? "—"}</span>
      </p>
      {!tableOk && (
        <div className="mt-3 rounded border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-100">
          A tabela <code className="text-amber-200/90">app_settings</code> não existe nesta base de dados. Corre as
          migrações Prisma (ex.: <code className="text-amber-200/90">npx prisma migrate deploy</code> em{" "}
          <code className="text-amber-200/90">packages/db</code>) e recarrega. Até lá, o Pix usa só o{" "}
          <code className="text-amber-200/90">.env</code> no servidor.
        </div>
      )}
      <p className="mt-2 text-xs text-[#666]">
        Valores vazios ao guardar (depois de editares o campo) removem o segredo do painel e voltam ao{" "}
        <code className="text-[#888]">.env</code>. Usa &quot;Remover… do painel&quot; para apagar sem editar o campo.
      </p>

      <form onSubmit={(e) => void submit(e)} className="mt-4 max-w-xl space-y-4">
        <label className={adminLabel}>
          Modo Pix
          <select
            className={adminInput}
            value={pixProviderMode}
            disabled={!tableOk}
            onChange={(e) => setPixProviderMode(e.target.value as "inherit" | "mock" | "mercadopago")}
          >
            <option value="inherit">Herdar do .env (PIX_PROVIDER)</option>
            <option value="mock">Mock (testes)</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </label>

        <label className={adminLabel}>
          Access Token (Mercado Pago)
          <input
            type="password"
            autoComplete="off"
            className={adminInput}
            value={accessToken}
            disabled={!tableOk}
            placeholder={
              c.pix.database?.hasAccessTokenInDatabase
                ? "•••• definido no painel — escreve para substituir"
                : "Opcional — ou usa MERCADO_PAGO_ACCESS_TOKEN no .env"
            }
            onChange={(e) => {
              setAccessToken(e.target.value);
              setAccessTouched(true);
            }}
          />
          {c.pix.database?.hasAccessTokenInDatabase && (
            <div className="mt-2">
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={busy || !tableOk}
                onClick={() => void clearPanelToken("access")}
              >
                {clearing === "access" ? "A remover…" : "Remover access token do painel"}
              </button>
            </div>
          )}
        </label>

        <label className={adminLabel}>
          Segredo do webhook (Mercado Pago)
          <input
            type="password"
            autoComplete="off"
            className={adminInput}
            value={webhookSecret}
            disabled={!tableOk}
            placeholder={
              c.pix.database?.hasWebhookSecretInDatabase
                ? "•••• definido no painel — escreve para substituir"
                : "Opcional — ou usa MERCADO_PAGO_WEBHOOK_SECRET no .env"
            }
            onChange={(e) => {
              setWebhookSecret(e.target.value);
              setWebhookTouched(true);
            }}
          />
          {c.pix.database?.hasWebhookSecretInDatabase && (
            <div className="mt-2">
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={busy || !tableOk}
                onClick={() => void clearPanelToken("webhook")}
              >
                {clearing === "webhook" ? "A remover…" : "Remover segredo do webhook do painel"}
              </button>
            </div>
          )}
        </label>

        <p className="text-xs text-[#666]">
          Tokens no painel: access{" "}
          <Badge ok={Boolean(c.pix.database?.hasAccessTokenInDatabase)} label={c.pix.database?.hasAccessTokenInDatabase ? "Sim" : "Não"} /> ·
          webhook{" "}
          <Badge ok={Boolean(c.pix.database?.hasWebhookSecretInDatabase)} label={c.pix.database?.hasWebhookSecretInDatabase ? "Sim" : "Não"} />
        </p>

        {err && <p className="text-sm text-red-400">{err}</p>}
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}

        <div className="flex flex-wrap gap-3">
          <GoldButton type="submit" disabled={busy || !tableOk}>
            {loading ? "A guardar…" : "Guardar Pix"}
          </GoldButton>
        </div>
      </form>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-xs font-medium text-[#888]">Estado efetivo (base + .env)</p>
        <div className="mt-2">
          <Row name="Provider efetivo">
            <span className="font-mono text-sm">{c.pix.effectiveProvider}</span>
          </Row>
          <Row name="Access token disponível">
            <Badge ok={c.pix.effectiveAccessTokenConfigured} label={c.pix.effectiveAccessTokenConfigured ? "Sim" : "Não"} />
          </Row>
          <Row name="Webhook secret disponível">
            <Badge ok={c.pix.effectiveWebhookSecretConfigured} label={c.pix.effectiveWebhookSecretConfigured ? "Sim" : "Não"} />
          </Row>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-xs font-medium text-[#888]">Variáveis no servidor (.env) — só leitura</p>
        <p className="mt-1 text-xs text-[#666]">Usadas no modo &quot;Herdar&quot; ou quando o campo não está preenchido no painel.</p>
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
    </div>
  );
}

export default function AdminConfiguracoesPage() {
  const [c, setC] = useState<Cfg | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [configTick, setConfigTick] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Cfg>("/api/admin/config");
        setC(data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, [configTick]);

  return (
    <div>
      <AdminPageHeader
        title="Configurações"
        subtitle="O bloco no topo permite configurar o Pix na base de dados. Abaixo: conta, URLs e outras variáveis de ambiente (só leitura)."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Configurações" }]}
      />
      {err && <p className="text-red-400">{err}</p>}
      {c && (
        <AdminPixSection
          c={c}
          onSaved={() => {
            setConfigTick((t) => t + 1);
          }}
        />
      )}
      <AdminChangePasswordSection />
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
