export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  guestPassesPerMonth: number;
  graceDays: number;
}

export const DEFAULT_PLANS: readonly MembershipPlan[] = [
  { id: 'monthly', name: 'Monthly', durationMonths: 1, guestPassesPerMonth: 1, graceDays: 3 },
  { id: 'annual', name: 'Annual', durationMonths: 12, guestPassesPerMonth: 2, graceDays: 7 },
  { id: 'student', name: 'Student (semester)', durationMonths: 4, guestPassesPerMonth: 0, graceDays: 0 },
];

export class PlanCatalog {
  private readonly plans: readonly MembershipPlan[];

  constructor(plans: readonly MembershipPlan[] = DEFAULT_PLANS) {
    this.plans = plans;
  }

  has(id: string): boolean {
    return this.plans.some((p) => p.id === id);
  }

  get(id: string): MembershipPlan {
    const plan = this.plans.find((p) => p.id === id);
    if (!plan) throw new Error(`Unknown membership plan: ${id}`);
    return plan;
  }

  all(): MembershipPlan[] {
    return this.plans.slice();
  }
}
