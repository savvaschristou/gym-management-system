import type { Membership, MembershipPlan } from './types';

/** What the app shows for a membership. Computed, never stored (ADR-003). */
export type MembershipStatus = 'active' | 'grace' | 'expired' | 'frozen' | 'cancelled';

/** Decides a membership's status on a given day ('YYYY-MM-DD'). */
export function membershipStatus(membership: Membership, plan: MembershipPlan, today: string): MembershipStatus {
  if (membership.state === 'frozen') return 'frozen';
  if (membership.state === 'cancelled') return 'cancelled';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || isNaN(Date.parse(today))) {
    throw new Error('Invalid date: ' + today);
  }
  const todayDay = Date.parse(today) / 86400000;
  const endDay = Date.parse(membership.endDate) / 86400000;

  if (todayDay <= endDay) return 'active';
  if (todayDay <= endDay + plan.graceDays) return 'grace';
  return 'expired';
}
