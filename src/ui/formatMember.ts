import type { Member } from '../domain/members/Member';
import type { MembershipPlan } from '../domain/members/MembershipPlan';
import { expirationDate } from '../domain/members/membershipDates';

/** e.g. "Hess, Sawyer (Annual) expires 2027-10-01" */
export function formatMemberSummary(member: Member, plan: MembershipPlan): string {
  return `${member.lastName}, ${member.firstName} (${plan.name}) expires ${expirationDate(member, plan)}`;
}
