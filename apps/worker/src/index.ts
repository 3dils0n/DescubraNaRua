import { processWebhookInboxBatch } from "@repo/payments";
import { processPendingWhatsAppBatch } from "@repo/whatsapp";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loop() {
  // eslint-disable-next-line no-console
  console.log("[rifa-worker] iniciado — inbox Pix + WhatsApp");
  for (;;) {
    try {
      const w = await processWebhookInboxBatch(25);
      const m = await processPendingWhatsAppBatch(25);
      if (w.done + w.errors + m.processed > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[rifa-worker] webhook ok=${w.done} err=${w.errors} whatsapp=${m.processed}`,
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[rifa-worker]", e);
    }
    await sleep(2500);
  }
}

loop();
