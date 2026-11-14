/**
 * Small helpers shared by the services. Each one used to be copied into
 * several files (newId was in three), which ESLint reported as magic numbers.
 */

const BASE_36 = 36;
const SKIP_DECIMAL_POINT = 2; // Math.random().toString(36) starts with "0."
const RANDOM_ID_CHARS = 8;

/** Unique enough for one browser; crypto.randomUUID isn't available in Jest. */
export function newId(): string {
  const random = Math.random().toString(BASE_36).slice(SKIP_DECIMAL_POINT, SKIP_DECIMAL_POINT + RANDOM_ID_CHARS);
  return Date.now().toString(BASE_36) + random;
}

/** Length of a 'YYYY-MM-DD' date. */
export const ISO_DAY_LENGTH = 10;

/** The 'YYYY-MM-DD' (UTC) part of a Date or an ISO timestamp string. */
export function isoDay(value: Date | string): string {
  const iso = typeof value === 'string' ? value : value.toISOString();
  return iso.slice(0, ISO_DAY_LENGTH);
}
