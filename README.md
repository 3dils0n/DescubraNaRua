# Descubra na Rua — Monorepo (Railway)

Plataforma de rifas com **Next.js** (`apps/web`), **worker** assíncrono (`apps/worker`), **cron** (`apps/cron`), **PostgreSQL + Prisma** (`packages/db`), integrações **Pix** (`packages/payments`) e **WhatsApp** (`packages/whatsapp`), e utilitários (`packages/shared`).

## Estrutura

```
apps/web          → rifa-web — frontend + API + recebimento de webhook (fila)
apps/worker       → rifa-worker — processa fila Pix + WhatsApp
apps/cron         → rifa-cron — expira reservas + reconsulta Pix presos
packages/db       → Prisma schema, client, migrations, seed
packages/shared   → env (Zod), constantes, rate-limit, máscaras, serviços stats/expire
packages/payments → Pix (Mercado Pago + mock), reserva, confirmação, fila webhook
packages/whatsapp → provedores + fila + envio em lote
```

## Scripts (raiz)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Next.js em desenvolvimento |
| `npm run build` | `prisma generate` + build do `rifa-web` |
| `npm run start` | Produção: `next start` do `rifa-web` |
| `npm run worker` | Processo contínuo do worker |
| `npm run cron` | Uma execução das tarefas agendadas (para Railway Cron) |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` (dev) |
| `npm run db:deploy` | `prisma migrate deploy` (produção) |
| `npm run db:seed` | Seed admin + rifa exemplo |
| `npm run db:push` | `db push` (sem migration file) |

## Configuração local

1. Copie `.env.example` para `.env` na **raiz** do repositório (com `DATABASE_URL`). O `apps/web/next.config.ts` carrega esse `.env` com `dotenv` — não precisas duplicar o ficheiro dentro de `apps/web`.
2. Suba o Postgres (`docker compose up -d`) ou use instância remota.
3. `npm install`
4. Primeira vez no banco: com `DATABASE_URL` definida, `npm run db:deploy` (aplica migrations). Em dev podes usar `npm run db:push` (sem ficheiros de migration). Se o banco **já existia** só com `db push`, vê **Baseline das migrations** antes de correr `db:deploy`.
5. `npm run db:seed`
6. `npm run dev`

**Admin:** `http://localhost:3000/admin/login` — `admin@rifa.com` / `123456` (seed).

### Testar no telemóvel (mesma Wi‑Fi)

O `npm run dev` usa `-H 0.0.0.0` para o Next aceitar ligações na rede local. No PC, confirma o IPv4 com `ipconfig` (ex.: `192.168.20.14`) e no telemóvel abre `http://192.168.20.14:3000`. O `next.config.ts` define `allowedDevOrigins` (por defeito `192.168.20.14`; podes listar mais no `.env` com `NEXT_DEV_ALLOWED_ORIGINS=IP1,IP2`) para o aviso **Cross origin request** a `/_next/*` não aparecer e, em futuras versões do Next, o HMR continuar permitido. Se não abrir: no **Windows**, permite **Node.js** na firewall ou entrada TCP **3000**; o telemóvel tem de estar na **mesma Wi‑Fi** que o PC.

### Baseline das migrations

O `.env` com `DATABASE_URL` fica na **raiz** do repositório. Os scripts `npm run db:*` carregam esse ficheiro automaticamente. Se correres `npx prisma …` **dentro de** `packages/db`, o Prisma não vê a raiz: usa `dotenv -e ../../.env --` antes do comando, ou prefere `npm run db:deploy` / `npm run db:migrate` a partir da raiz.

- **Banco vazio:** na raiz, `npm run db:deploy` (ou em `packages/db`: `npm run db:deploy`). Aplica `20260406150000_init` e regista em `_prisma_migrations`.

- **Banco já criado antes com `db push` (sem migrations):** não corras `migrate deploy` se isso repetir `CREATE TABLE`. Marca a migração como aplicada sem reexecutar o SQL:

  ```bash
  cd packages/db
  npx dotenv -e ../../.env -- prisma migrate resolve --applied 20260406150000_init
  npx dotenv -e ../../.env -- prisma migrate status
  ```

  Use `resolve` apenas se o schema no PostgreSQL for o mesmo que o `schema.prisma` atual (caso típico após `db push` alinhado ao repo).

## Deploy Railway

Veja **[docs/RAILWAY.md](./docs/RAILWAY.md)** para serviços, variáveis e comandos.

## Webhook Pix

O endpoint **não** confirma pagamento na mesma requisição: grava em `webhook_inbox` e o **worker** processa. Para desenvolvimento sem worker, rode também `npm run worker` em outro terminal.

## Logo

Coloque `logo_rifa.png` em `apps/web/public/logo_rifa.png` (ou copie da raiz do projeto).
