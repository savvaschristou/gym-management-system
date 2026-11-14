import type { UserRepository } from '../../data/UserRepository';
import type { SessionUser } from '../../domain/auth/User';
import { addDays, currentMembership, membershipStatus } from '../../domain/membership';
import type { MembershipStatus } from '../../domain/membership';
import type { CheckIn, Membership, MembershipPlan } from '../../domain/types';

/**
 * The staff tools: find members, let them in (check-in), and give them a plan.
 *
 * Every method first checks that the person calling it is staff (ADR-004):
 * the /admin route already hides the page from members, but the rule also
 * lives here, so it holds no matter where the service is called from.
 */

/** The parts of a repository this service needs; LocalStorageRepository fits. */
interface Store<T> {
  findAll(): T[];
  findById(id: string): T | undefined;
  save(record: T): void;
}

export class NotAuthorizedError extends Error {
  constructor() {
    super('Only staff can do that');
    this.name = 'NotAuthorizedError';
  }
}

export interface MemberSummary {
  member: SessionUser;
  membership: Membership | null;
  plan: MembershipPlan | null;
  /** Status today, or null when the member has no membership. */
  status: MembershipStatus | null;
}

export type CheckInResult = { ok: true; status: MembershipStatus; checkIn: CheckIn } | { ok: false; reason: string };

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export class StaffService {
  constructor(
    private readonly users: UserRepository,
    private readonly plans: Store<MembershipPlan>,
    private readonly memberships: Store<Membership>,
    private readonly checkIns: Store<CheckIn>
  ) {}

  /** Members whose name or email contains the search text (any case), sorted by name. */
  searchMembers(actor: SessionUser, query: string, today: string): MemberSummary[] {
    requireStaff(actor);
    const q = query.trim().toLowerCase();
    return this.users
      .findAll()
      .filter((u) => u.role === 'member')
      .filter((u) => !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(({ passwordHash, ...member }) => this.summarize(member, today));
  }

  /** Plans that can still be assigned. */
  activePlans(actor: SessionUser): MembershipPlan[] {
    requireStaff(actor);
    return this.plans.findAll().filter((p) => p.isActive);
  }

  /**
   * Lets a member in if their membership is active or in its grace period,
   * and records who let them in. Otherwise returns the reason they can't.
   */
  checkIn(actor: SessionUser, memberId: string, today: string, now = new Date()): CheckInResult {
    requireStaff(actor);
    const member = this.findMember(memberId);
    const { membership, plan, status } = this.summarize(member, today);
    if (!membership || !plan || !status) return { ok: false, reason: 'No membership on file' };
    if (status === 'frozen') return { ok: false, reason: 'Membership is frozen' };
    if (status === 'cancelled') return { ok: false, reason: 'Membership is cancelled' };
    if (status === 'expired') return { ok: false, reason: `Membership expired on ${membership.endDate}` };

    const checkIn: CheckIn = { id: newId(), memberId, staffId: actor.id, checkedInAt: now.toISOString() };
    this.checkIns.save(checkIn);
    return { ok: true, status, checkIn };
  }

  /** Starts a new membership on the chosen plan, beginning today. Older memberships stay as history. */
  assignPlan(actor: SessionUser, memberId: string, planId: string, today: string): Membership {
    requireStaff(actor);
    this.findMember(memberId);
    const plan = this.plans.findById(planId);
    if (!plan || !plan.isActive) throw new Error('That plan is not available');

    const membership: Membership = {
      id: newId(),
      userId: memberId,
      planId,
      startDate: today,
      endDate: addDays(today, plan.durationDays),
      state: 'active',
    };
    this.memberships.save(membership);
    return membership;
  }

  private findMember(memberId: string) {
    const user = this.users.findAll().find((u) => u.id === memberId && u.role === 'member');
    if (!user) throw new Error('No member with that id');
    return user;
  }

  private summarize(member: SessionUser, today: string): MemberSummary {
    const { passwordHash, ...safe } = member as SessionUser & { passwordHash?: string };
    const membership = currentMembership(this.memberships.findAll(), member.id);
    const plan = membership ? this.plans.findById(membership.planId) ?? null : null;
    const status = membership && plan ? membershipStatus(membership, plan, today) : null;
    return { member: safe, membership, plan, status };
  }
}

function requireStaff(actor: SessionUser) {
  if (actor.role !== 'staff') throw new NotAuthorizedError();
}
