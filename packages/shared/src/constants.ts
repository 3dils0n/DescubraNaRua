/** Fallback quando a rifa não define minutos (env global opcional) */
export function getDefaultReservationExpirationMinutes(): number {
  const v = process.env.RESERVATION_EXPIRATION_MINUTES;
  if (v && !Number.isNaN(Number(v))) return Number(v);
  return 20;
}

export function getRankingCacheTtlSeconds(): number {
  const v = process.env.RANKING_CACHE_TTL_SECONDS;
  if (v && !Number.isNaN(Number(v))) return Number(v);
  return 60;
}

export function getRecentPurchasesWindowMinutes(): number {
  const v = process.env.RECENT_PURCHASES_WINDOW_MINUTES;
  if (v && !Number.isNaN(Number(v))) return Number(v);
  return 120;
}
