import type { NewMemberInput } from '../domain/members/Member';
import type { PlanCatalog } from '../domain/members/MembershipPlan';

export class MemberValidator {
  constructor(private readonly plans: PlanCatalog) {}

  /** Returns every problem found; an empty array means the input is valid. */
  validate(input: NewMemberInput): string[] {
    const errors: string[] = [];
    if (!input.firstName.trim()) errors.push('First name is required');
    if (!input.lastName.trim()) errors.push('Last name is required');
    if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.push('Email is not valid');
    if (!this.plans.has(input.planId)) errors.push('Choose a membership plan');
    return errors;
  }
}
