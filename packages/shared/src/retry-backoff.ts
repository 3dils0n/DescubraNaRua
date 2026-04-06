/** Backoff após falha na tentativa `attempt` (1-based): 1m, 5m, 15m, 30m+ */
export function getRetryDelayMsAfterFailure(attempt: number): number {
  const minutes =
    attempt <= 1 ? 1 : attempt === 2 ? 5 : attempt === 3 ? 15 : 30;
  return minutes * 60 * 1000;
}
