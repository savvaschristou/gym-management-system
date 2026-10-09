import type { Member } from './Member';
import type { MembershipPlan } from './MembershipPlan';

// Pure functions on ISO (YYYY-MM-DD) date strings, computed in UTC.

function parse(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function format(y: number, m: number, d: number): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0');
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/** Adds months, clamping to the end of the month (Jan 31 + 1 month = Feb 28). */
export function addMonths(iso: string, months: number): string {
  const { y, m, d } = parse(iso);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return format(year, month, Math.min(d, daysInMonth));
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parse(iso);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return format(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function expirationDate(member: Member, plan: MembershipPlan): string {
  return addMonths(member.startDate, plan.durationMonths);
}

/** True from the start date through expiration plus grace days. */
export function isActiveOn(
  member: Member,
  plan: MembershipPlan,
  today: string
): boolean {
  const lastDay = addDays(expirationDate(member, plan), plan.graceDays);
  // ISO dates compare correctly as strings.
  return today >= member.startDate && today <= lastDay;
}
