import type { Membership, MembershipPlan } from './types';

/** What the app shows for a membership. Computed, never stored (ADR-003). */
export type MembershipStatus = 'active' | 'grace' | 'expired' | 'frozen' | 'cancelled';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Turns 'YYYY-MM-DD' into a whole day number so dates compare as days,
 * with no time-of-day or time-zone surprises. Throws on anything else.
 */
function toDayNumber(isoDate: string): number {
  const ms = Date.parse(isoDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || isNaN(ms)) {
    throw new Error('Invalid date: ' + isoDate);
  }
  return ms / MS_PER_DAY;
}

/**
 * Decides a membership's status on a given day ('YYYY-MM-DD').
 * Frozen and cancelled are choices someone made, so they win over dates.
 * Otherwise: active through the end date, then grace for the plan's grace
 * days, then expired.
 */
export function membershipStatus(membership: Membership, plan: MembershipPlan, today: string): MembershipStatus {
  if (membership.state !== 'active') return membership.state;

  const day = toDayNumber(today);
  const lastActiveDay = toDayNumber(membership.endDate);
  const lastGraceDay = lastActiveDay + plan.graceDays;

  if (day <= lastActiveDay) return 'active';
  if (day <= lastGraceDay) return 'grace';
  return 'expired';
}
