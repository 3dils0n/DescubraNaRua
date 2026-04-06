const PREFIX = "[descubra-rifa]";

type LogCtx = {
  external_payment_id?: string | null;
  txid?: string | null;
  reserva_id?: string | null;
  webhook_inbox_id?: string | null;
  [k: string]: unknown;
};

function line(level: "info" | "warn" | "error", msg: string, ctx?: LogCtx) {
  const payload = ctx ? { ...ctx } : {};
  const s = `${PREFIX} [${level.toUpperCase()}] ${msg} ${Object.keys(payload).length ? JSON.stringify(payload) : ""}`;
  if (level === "error") console.error(s);
  else if (level === "warn") console.warn(s);
  else console.log(s);
}

export const log = {
  webhookReceived: (ctx: LogCtx) => line("info", "webhook recebido", ctx),
  webhookEnqueued: (ctx: LogCtx) => line("info", "webhook enfileirado (inbox)", ctx),
  workerInboxStart: (ctx: LogCtx) => line("info", "worker processando inbox", ctx),
  paymentApplied: (ctx: LogCtx) => line("info", "pagamento aplicado (reserva/números/pix)", ctx),
  paymentIdempotent: (ctx: LogCtx) => line("info", "pagamento já processado (idempotente)", ctx),
  whatsappSent: (ctx: LogCtx) => line("info", "whatsapp enviado ou falha registrada", ctx),
  warn: (msg: string, ctx?: LogCtx) => line("warn", msg, ctx),
  error: (msg: string, ctx?: LogCtx) => line("error", msg, ctx),
};
