import { expirePendingReservations } from "@repo/shared/server";
import { resyncStalePendingPixPayments } from "@repo/payments";

async function main() {
  const a = await expirePendingReservations();
  const b = await resyncStalePendingPixPayments(8);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ...a, ...b, at: new Date().toISOString() }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
