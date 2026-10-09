import type { MemberRepository } from '../data/MemberRepository';
import type { Member, NewMemberInput } from '../domain/members/Member';
import type { PlanCatalog } from '../domain/members/MembershipPlan';
import { isActiveOn } from '../domain/members/membershipDates';
import type { MemberValidator } from './MemberValidator';
import type { WelcomeNotifier } from './WelcomeNotifier';

export type RegisterResult =
  | { ok: true; member: Member }
  | { ok: false; errors: string[] };

/**
 * Compared with MemberService.before.ts:
 *  [S] Single Responsibility: validation, plan rules, storage, notification
 *      and formatting each live in their own class or function. This class
 *      only coordinates the registration steps.
 *  [O] Open/Closed: plan terms are data in PlanCatalog, not switch
 *      statements. A new plan needs no change here.
 *  [D] Dependency Inversion: the repository, notifier, clock and id
 *      generator are injected as abstractions, so nothing is hard-wired to
 *      localStorage, console, or Date.
 */
export class MemberService {
  constructor(
    private readonly repo: MemberRepository,
    private readonly plans: PlanCatalog,
    private readonly validator: MemberValidator,
    private readonly notifier: WelcomeNotifier,
    private readonly today: () => string = () => new Date().toISOString().slice(0, 10),
    private readonly newId: () => string = () => String(Date.now())
  ) {}

  register(input: NewMemberInput): RegisterResult {
    const errors = this.validator.validate(input);
    if (errors.length > 0) return { ok: false, errors };

    const member: Member = {
      id: this.newId(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      planId: input.planId,
      startDate: this.today(),
    };
    this.repo.save(member);
    this.notifier.sendWelcome(member);
    return { ok: true, member };
  }

  isActive(memberId: string, today: string = this.today()): boolean {
    const member = this.repo.findById(memberId);
    if (!member) return false;
    return isActiveOn(member, this.plans.get(member.planId), today);
  }
}
