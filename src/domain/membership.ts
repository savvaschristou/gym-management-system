import type { Membership, MembershipPlan } from './types';

/** What the app shows for a membership. Computed, never stored (ADR-003). */
export type MembershipStatus = 'active' | 'grace' | 'expired' | 'frozen' | 'cancelled';

/** Decides a membership's status on a given day ('YYYY-MM-DD'). */
export function membershipStatus(membership: Membership, plan: MembershipPlan, today: string): MembershipStatus {
  throw new Error('Not implemented yet');
}
