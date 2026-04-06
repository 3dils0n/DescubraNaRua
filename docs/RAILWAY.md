# Deploy na Railway — arquitetura

Este repositório é um **monorepo** com quatro peças na mesma plataforma:

| Serviço Railway (nome sugerido) | Pacote / pasta | Comando Start | Função |
|--------------------------------|----------------|---------------|--------|
| **rifa-web** | `apps/web` (`rifa-web`) | `npm run start` (na raiz) ou `npm run start --workspace=rifa-web` | Next.js: site, admin, APIs, **recebimento** de webhooks Pix (só enfileira) |
| **rifa-worker** | `apps/worker` (`rifa-worker`) | `npm run worker` | Loop: processa `webhook_inbox` + envia WhatsApp pendente |
| **rifa-cron** | `apps/cron` (`rifa-cron`) | `npm run cron` | **One-shot**: expira reservas + reconsulta Pix presos (agendar a cada 2–5 min) |
| **rifa-db** | Plugin PostgreSQL | — | `DATABASE_URL` injetada pela Railway |

**Build (web):** na raiz do repositório: `npm install` e `npm run build`.

**Migrations:** `npm run db:deploy` (produção) após o primeiro deploy, com `DATABASE_URL` apontando para o Postgres da Railway.

**Seed (só uma vez / staging):** `npm run db:seed`.

## Variáveis por serviço

### rifa-web
- `DATABASE_URL` (referência ao Postgres Railway)
- `APP_BASE_URL` e `NEXT_PUBLIC_APP_URL` = URL pública do web (ex.: `https://rifa-web.up.railway.app`)
- `NEXTAUTH_SECRET` ou `JWT_SECRET`
- `PIX_PROVIDER`, `MERCADO_PAGO_*`, `WHATSAPP_*` conforme integração
- `CRON_SECRET` (se for chamar `/api/cron/expire` manualmente)

### rifa-worker
- `DATABASE_URL` (mesmo banco)
- Mesmas variáveis de **Pix** e **WhatsApp** do web (para consultar gateway e enviar mensagens)
- `APP_BASE_URL` / `NEXT_PUBLIC_APP_URL` (URLs em mensagens)

### rifa-cron
- `DATABASE_URL`
- `PIX_PROVIDER` + tokens Mercado Pago (para `resyncStalePendingPixPayments`)

### rifa-db (Postgres)
- Copiar `DATABASE_URL` para os serviços que acessam o banco.

## Root Directory na Railway

Para cada serviço, defina o **Root Directory** vazio ou a **raiz do repositório** e use os scripts da raiz:

- **Custom Start Command** para web: `npm run start`
- Para worker: `npm run worker`
- Para cron: `npm run cron`

Ou entre no diretório e use `npm run start --workspace=rifa-web` etc.

## Fluxo assíncrono

1. **Mercado Pago** → `POST /api/webhooks/mercadopago` (rifa-web) grava em `webhook_inbox` com status `PENDING` e responde rápido.
2. **rifa-worker** chama `processWebhookInboxBatch`: consulta o gateway, aplica pagamento (`applyApprovedPaymentByExternalPaymentId`), enfileira WhatsApp (`whatsapp_messages` PENDING).
3. **rifa-worker** chama `processPendingWhatsAppBatch`: envia mensagens via provedor configurado.
4. **rifa-cron** libera reservas expiradas e reprocessa Pix pendentes antigos.

Idempotência: `webhook_inbox.idempotency_key` único; confirmação de pagamento já evita duplicar números/reserva.

## Domínio customizado

Aponte o domínio para **rifa-web**. Atualize `APP_BASE_URL` e `NEXT_PUBLIC_APP_URL`. No Mercado Pago, configure a mesma URL base para webhooks.
