-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'DRAWN');

-- CreateEnum
CREATE TYPE "NumberSelectionMode" AS ENUM ('MANUAL', 'RANDOM', 'MIXED');

-- CreateEnum
CREATE TYPE "RaffleNumberStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'PAID', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PixProvider" AS ENUM ('MERCADOPAGO', 'MOCK');

-- CreateEnum
CREATE TYPE "PixInternalStatus" AS ENUM ('PENDING', 'APPROVED', 'EXPIRED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WhatsAppProvider" AS ENUM ('CONSOLE', 'META', 'ZAPI', 'EVOLUTION', 'MOCK');

-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('PAYMENT_APPROVED', 'RESERVATION_CREATED', 'PAYMENT_PENDING_REMINDER');

-- CreateEnum
CREATE TYPE "WhatsAppSendStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "WebhookInboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rifas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "premio" TEXT NOT NULL,
    "imagem" TEXT,
    "valor_numero" DECIMAL(12,2) NOT NULL,
    "quantidade_total" INTEGER NOT NULL,
    "numero_padding" INTEGER NOT NULL DEFAULT 4,
    "data_sorteio" TIMESTAMP(3) NOT NULL,
    "regulamento" TEXT NOT NULL,
    "modo_selecao_numeros" "NumberSelectionMode" NOT NULL,
    "quantidade_minima_compra" INTEGER NOT NULL,
    "quantidade_maxima_compra" INTEGER NOT NULL,
    "multiplo_compra" INTEGER,
    "reserva_expira_minutos" INTEGER NOT NULL DEFAULT 20,
    "exibir_ranking_publico" BOOLEAN NOT NULL DEFAULT true,
    "anonimizar_ranking_publico" BOOLEAN NOT NULL DEFAULT true,
    "tamanho_ranking_publico" INTEGER NOT NULL DEFAULT 10,
    "ativar_feed_compras" BOOLEAN NOT NULL DEFAULT true,
    "ativar_contador_tempo_real" BOOLEAN NOT NULL DEFAULT true,
    "ativar_whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "mensagem_whatsapp_padrao" TEXT,
    "status" "RaffleStatus" NOT NULL DEFAULT 'DRAFT',
    "numero_vencedor_id" TEXT,
    "sorteado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeros_rifa" (
    "id" TEXT NOT NULL,
    "rifa_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" "RaffleNumberStatus" NOT NULL DEFAULT 'AVAILABLE',
    "blocked_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "numeros_rifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "aceitou_termos" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "rifa_id" TEXT NOT NULL,
    "participante_id" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "quantidade" INTEGER NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_numeros" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "numero_rifa_id" TEXT NOT NULL,

    CONSTRAINT "reserva_numeros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_pix" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "provider" "PixProvider" NOT NULL,
    "external_payment_id" TEXT,
    "external_reference" TEXT NOT NULL,
    "txid" TEXT,
    "status_interno" "PixInternalStatus" NOT NULL DEFAULT 'PENDING',
    "status_gateway" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "qr_code_text" TEXT,
    "qr_code_base64" TEXT,
    "pix_copia_e_cola" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "webhook_received_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "raw_response_json" JSONB,
    "integration_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks_pix" (
    "id" TEXT NOT NULL,
    "provider" "PixProvider" NOT NULL,
    "topic" TEXT,
    "resource_id" TEXT,
    "payload" JSONB NOT NULL,
    "headers_json" JSONB,
    "signature_ok" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_inbox" (
    "id" TEXT NOT NULL,
    "provider" "PixProvider" NOT NULL,
    "idempotency_key" TEXT,
    "topic" TEXT,
    "resource_id" TEXT,
    "payload" JSONB NOT NULL,
    "headers_json" JSONB,
    "status" "WebhookInboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_integracao" (
    "id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "provider" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_integracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "participante_id" TEXT NOT NULL,
    "provider" "WhatsAppProvider" NOT NULL,
    "telefone" TEXT NOT NULL,
    "tipo_mensagem" "WhatsAppMessageType" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status_envio" "WhatsAppSendStatus" NOT NULL DEFAULT 'PENDING',
    "provider_message_id" TEXT,
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rifas_slug_key" ON "rifas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rifas_numero_vencedor_id_key" ON "rifas"("numero_vencedor_id");

-- CreateIndex
CREATE INDEX "numeros_rifa_rifa_id_status_idx" ON "numeros_rifa"("rifa_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "numeros_rifa_rifa_id_numero_key" ON "numeros_rifa"("rifa_id", "numero");

-- CreateIndex
CREATE INDEX "participantes_telefone_idx" ON "participantes"("telefone");

-- CreateIndex
CREATE INDEX "participantes_email_idx" ON "participantes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_codigo_key" ON "reservas"("codigo");

-- CreateIndex
CREATE INDEX "reservas_rifa_id_status_idx" ON "reservas"("rifa_id", "status");

-- CreateIndex
CREATE INDEX "reservas_expires_at_idx" ON "reservas"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_numeros_reserva_id_numero_rifa_id_key" ON "reserva_numeros"("reserva_id", "numero_rifa_id");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_numeros_numero_rifa_id_key" ON "reserva_numeros"("numero_rifa_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pix_external_payment_id_key" ON "pagamentos_pix"("external_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pix_external_reference_key" ON "pagamentos_pix"("external_reference");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pix_txid_key" ON "pagamentos_pix"("txid");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pix_idempotency_key_key" ON "pagamentos_pix"("idempotency_key");

-- CreateIndex
CREATE INDEX "pagamentos_pix_reserva_id_idx" ON "pagamentos_pix"("reserva_id");

-- CreateIndex
CREATE INDEX "pagamentos_pix_status_interno_idx" ON "pagamentos_pix"("status_interno");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_pix_idempotency_key_key" ON "webhooks_pix"("idempotency_key");

-- CreateIndex
CREATE INDEX "webhooks_pix_processed_idx" ON "webhooks_pix"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_inbox_idempotency_key_key" ON "webhook_inbox"("idempotency_key");

-- CreateIndex
CREATE INDEX "webhook_inbox_status_next_retry_at_created_at_idx" ON "webhook_inbox"("status", "next_retry_at", "created_at");

-- CreateIndex
CREATE INDEX "logs_integracao_context_idx" ON "logs_integracao"("context");

-- CreateIndex
CREATE INDEX "whatsapp_messages_reserva_id_idx" ON "whatsapp_messages"("reserva_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_status_envio_next_retry_at_created_at_idx" ON "whatsapp_messages"("status_envio", "next_retry_at", "created_at");

-- AddForeignKey
ALTER TABLE "rifas" ADD CONSTRAINT "rifas_numero_vencedor_id_fkey" FOREIGN KEY ("numero_vencedor_id") REFERENCES "numeros_rifa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeros_rifa" ADD CONSTRAINT "numeros_rifa_rifa_id_fkey" FOREIGN KEY ("rifa_id") REFERENCES "rifas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_rifa_id_fkey" FOREIGN KEY ("rifa_id") REFERENCES "rifas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_numeros" ADD CONSTRAINT "reserva_numeros_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_numeros" ADD CONSTRAINT "reserva_numeros_numero_rifa_id_fkey" FOREIGN KEY ("numero_rifa_id") REFERENCES "numeros_rifa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_pix" ADD CONSTRAINT "pagamentos_pix_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
