# Deploy no Render

Guia para publicar o monorepo no [Render](https://render.com): **Postgres**, **app web (Next.js)**, **worker** e **tarefas agendadas**.

## Visão geral

| Serviço Render (nome sugerido) | Função | Comando de arranque |
|--------------------------------|--------|---------------------|
| **PostgreSQL** | Base de dados | — (variável `DATABASE_URL` gerada pelo Render) |
| **rifa-web** | Site, admin, APIs, receção de webhooks Pix | `npm run start` |
| **rifa-worker** | Processa `webhook_inbox` + WhatsApp pendente | `npm run worker` |
| **Cron** (ver abaixo) | Expirar reservas + reconsultar Pix | HTTP ou `npm run cron` |

**Raiz do repositório:** todos os comandos assumem a **raiz** do repo (onde está o `package.json` principal), não `apps/web` isolado.

**Requisitos:** conta Render; o **plano gratuito** pode colocar o `rifa-web` em *sleep* após inatividade (primeiro pedido demora mais).

---

## 1. Base de dados PostgreSQL

1. No painel Render: **New** → **PostgreSQL**.
2. Escolhe nome, região e plano.
3. Após criar, copia a **Internal Database URL** (serviços no mesmo Render) ou **External** (migrations a partir do teu PC). O formato costuma incluir `?sslmode=require` — mantém-no.

---

## 2. Serviço web (`rifa-web`)

1. **New** → **Web Service** → liga o repositório Git.
2. **Runtime:** Node.
3. **Root Directory:** vazio (raiz do monorepo).
4. **Build Command:**

   ```bash
   npm install && npm run build
   ```

5. **Start Command:**

   ```bash
   npm run start
   ```

6. **Variáveis de ambiente** (mínimo):

   | Variável | Obrigatório | Notas |
   |----------|-------------|--------|
   | `DATABASE_URL` | Sim | Cola a URL do Postgres (Internal se só o Render aceder). |
   | `APP_BASE_URL` | Sim | URL pública do web, ex.: `https://rifa-web.onrender.com` |
   | `NEXT_PUBLIC_APP_URL` | Sim | Igual à anterior (usada no browser). |
   | `NEXTAUTH_SECRET` ou `JWT_SECRET` | Sim | String aleatória com **≥ 16 caracteres** (login admin). |
   | `PIX_PROVIDER`, `MERCADO_PAGO_*`, `WHATSAPP_*` | Conforme integração | Igual ao `.env.example` na raiz. |
   | `CRON_SECRET` | Recomendado | Se usares o endpoint HTTP de cron (passo 5). |

7. **Node:** se o build falhar por versão, define `NODE_VERSION` = `20` ou `22` nas variáveis de ambiente (ou `engines` no `package.json`).

8. Guarda a **URL pública** do serviço (ex.: `https://rifa-web-xxxx.onrender.com`) e atualiza `APP_BASE_URL` e `NEXT_PUBLIC_APP_URL` se ainda estiverem placeholders.

---

## 3. Migrations (primeira vez)

Com o **Postgres** já criado e `DATABASE_URL` válida:

1. **Opção A — local:** na raiz do repo, com `.env` a apontar para o mesmo `DATABASE_URL` do Render:

   ```bash
   npm run db:deploy
   ```

2. **Opção B — shell no Render:** abre **Shell** no serviço web (se disponível no plano) e corre `npm run db:deploy` na raiz.

3. **Seed (opcional, staging):** `npm run db:seed` (cria admin `admin@rifa.com` — altera a senha no painel).

Se o Render oferecer **Release Command** / comando pré-arranque, podes usar `npm run db:deploy` aí; **não** dupliques em build e release sem necessidade.

---

## 4. Worker (`rifa-worker`)

1. **New** → **Background Worker** (ou outro serviço de processo contínuo).
2. Mesmo repositório e **Root Directory** na raiz.
3. **Build Command:** `npm install` (o `postinstall` corre `prisma generate`).
4. **Start Command:**

   ```bash
   npm run worker
   ```

5. **Variáveis:** `DATABASE_URL` (igual ao web), **Pix** e **WhatsApp** como no web (o worker consulta gateway e envia mensagens).

Sem o worker, os webhooks **ficam na fila** (`webhook_inbox`) e o WhatsApp não sai.

---

## 5. Cron (expirar reservas + Pix presos)

Tens duas formas:

### A) Job em Node que corre o pacote `apps/cron`

Cria um **Background Worker** ou um **Cron Job** (se o plano incluir) com:

- **Start / comando:** `npm run cron`
- **Variáveis:** `DATABASE_URL` (e `PIX_PROVIDER` + token Mercado Pago se o re-sync precisar).

Agenda a execução a cada **2–5 minutos** (conforme o que o Render permitir no teu plano).

### B) Endpoint HTTP no próprio web

O projeto expõe `GET /api/cron/expire` (protegido se `CRON_SECRET` estiver definido).

1. Define `CRON_SECRET` no web.
2. Usa um **Cron Job** externo (Render Cron, GitHub Actions, etc.) que chama:

   ```http
   GET https://O_TEU_DOMINIO.onrender.com/api/cron/expire
   Authorization: Bearer O_SEU_CRON_SECRET
   ```

Nota: o `apps/cron` no repositório faz **mais** do que `expire` (também `resyncStalePendingPixPayments`). Para o fluxo completo igual ao Railway, prefere a opção **A** com `npm run cron` ou mantém o worker + cron de expiração ajustado às tuas necessidades.

---

## 6. Webhook Mercado Pago

No painel Mercado Pago, a URL de notificação deve ser:

`https://O_TEU_DOMINIO/api/webhooks/mercadopago`

O domínio **deve** ser o público do `rifa-web` no Render. Sem o worker a correr, o evento fica em fila até ser processado.

---

## 7. Domínio próprio

1. No Render: **Custom Domains** no serviço web.
2. Atualiza `APP_BASE_URL` e `NEXT_PUBLIC_APP_URL` para `https://teu-dominio.com`.
3. **Redeploy** do web para aplicar.
4. Atualiza o webhook no Mercado Pago.

---

## 8. Checklist rápido

- [ ] Postgres criado e `DATABASE_URL` nos serviços.
- [ ] Web com build/start na raiz; `db:deploy` aplicado.
- [ ] `APP_BASE_URL` / `NEXT_PUBLIC_APP_URL` corretos.
- [ ] Segredo JWT para admin.
- [ ] Worker a correr com as mesmas credenciais Pix/WhatsApp.
- [ ] Cron (`npm run cron` ou HTTP) a correr em intervalo curto.
- [ ] Webhook MP apontando para o URL do Render.

Para mais detalhes da arquitetura (fila, idempotência), vê também [RAILWAY.md](./RAILWAY.md) — o fluxo é o mesmo, só mudam o painel e os nomes dos serviços.
