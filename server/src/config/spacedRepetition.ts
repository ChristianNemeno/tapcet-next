export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
export const INITIAL_INTERVAL_DAYS = REVIEW_INTERVALS[0];

export function nextIntervalAfterCorrect(current: number): number {
  const idx = REVIEW_INTERVALS.indexOf(current as (typeof REVIEW_INTERVALS)[number]);
  if (idx === -1 || idx === REVIEW_INTERVALS.length - 1) {
    return REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
  }
  return REVIEW_INTERVALS[idx + 1];
}

export function intervalAfterMiss(): number {
  return INITIAL_INTERVAL_DAYS;
}
