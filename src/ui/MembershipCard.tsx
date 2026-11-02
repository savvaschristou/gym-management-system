import { membershipStatus } from '../domain/membership';
import type { MembershipStatus } from '../domain/membership';
import type { Membership, MembershipPlan } from '../domain/types';

/**
 * Shows a member's plan, its status today and when it ends, on the member
 * home page. The status itself comes from membershipStatus(), so this
 * component only decides how to display it.
 */
interface MembershipCardProps {
  membership: Membership | null;
  plan: MembershipPlan | null;
  /** Today's date as 'YYYY-MM-DD'. Passed in so tests can pick the day. */
  today: string;
}

const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: 'Active',
  grace: 'Grace period',
  expired: 'Expired',
  frozen: 'Frozen',
  cancelled: 'Cancelled',
};

export default function MembershipCard({ membership, plan, today }: MembershipCardProps) {
  if (!membership || !plan) {
    return (
      <section>
        <h2>Membership</h2>
        <p>No membership yet</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Membership</h2>
      <p>{plan.name}</p>
      <p>Status: {STATUS_LABEL[membershipStatus(membership, plan, today)]}</p>
      <p>Ends {membership.endDate}</p>
    </section>
  );
}
