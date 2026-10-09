import { InMemoryMemberRepository } from '../data/InMemoryMemberRepository';
import { LocalStorageMemberRepository } from '../data/LocalStorageMemberRepository';
import type { Member } from '../domain/members/Member';
import { DEFAULT_PLANS, PlanCatalog } from '../domain/members/MembershipPlan';
import { addDays, addMonths } from '../domain/members/membershipDates';
import { formatMemberSummary } from '../ui/formatMember';
import { MemberService } from './MemberService';
import { MemberValidator } from './MemberValidator';
import type { WelcomeNotifier } from './WelcomeNotifier';

class RecordingNotifier implements WelcomeNotifier {
  sent: Member[] = [];
  sendWelcome(member: Member): void {
    this.sent.push(member);
  }
}

function setup(plans: PlanCatalog = new PlanCatalog()) {
  const repo = new InMemoryMemberRepository();
  const notifier = new RecordingNotifier();
  const service = new MemberService(
    repo,
    plans,
    new MemberValidator(plans),
    notifier,
    () => '2026-10-01',
    () => 'id-1'
  );
  return { repo, notifier, service };
}

const input = {
  firstName: '  Sawyer ',
  lastName: ' Hess ',
  email: ' Sawyer@Example.COM ',
  planId: 'monthly',
};

describe('MemberService', () => {
  it('saves and welcomes a valid registration', () => {
    const { repo, notifier, service } = setup();
    const result = service.register(input);
    expect(result).toEqual({
      ok: true,
      member: {
        id: 'id-1',
        firstName: 'Sawyer',
        lastName: 'Hess',
        email: 'sawyer@example.com',
        planId: 'monthly',
        startDate: '2026-10-01',
      },
    });
    expect(repo.findAll()).toHaveLength(1);
    expect(notifier.sent).toHaveLength(1);
  });

  it('returns all four errors for invalid input and saves nothing', () => {
    const { repo, notifier, service } = setup();
    const result = service.register({ firstName: ' ', lastName: '', email: 'bad', planId: '' });
    expect(result).toEqual({
      ok: false,
      errors: [
        'First name is required',
        'Last name is required',
        'Email is not valid',
        'Choose a membership plan',
      ],
    });
    expect(repo.findAll()).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it('monthly member is active through the grace period only', () => {
    const { service } = setup();
    service.register(input);
    expect(service.isActive('id-1', '2026-11-04')).toBe(true);
    expect(service.isActive('id-1', '2026-11-05')).toBe(false);
    expect(service.isActive('missing', '2026-10-02')).toBe(false);
  });

  it('supports a new plan without changing MemberService', () => {
    const plans = new PlanCatalog([
      ...DEFAULT_PLANS,
      { id: 'family', name: 'Family', durationMonths: 6, guestPassesPerMonth: 3, graceDays: 5 },
    ]);
    const { service } = setup(plans);
    service.register({ ...input, planId: 'family' });
    expect(service.isActive('id-1', '2027-04-06')).toBe(true);
    expect(service.isActive('id-1', '2027-04-07')).toBe(false);
  });
});

describe('membership dates', () => {
  it('addMonths handles edge cases', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
    expect(addMonths('2026-10-01', 12)).toBe('2027-10-01');
    expect(addMonths('2026-12-31', 2)).toBe('2027-02-28');
  });

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
});

describe('LocalStorageMemberRepository', () => {
  it('round-trips members through a fake store and replaces by id', () => {
    const data: Record<string, string> = {};
    const store = {
      getItem: (k: string) => (k in data ? data[k] : null),
      setItem: (k: string, v: string) => {
        data[k] = v;
      },
    };
    const repo = new LocalStorageMemberRepository(store);
    const m: Member = {
      id: 'a', firstName: 'A', lastName: 'B', email: 'a@b.co', planId: 'annual', startDate: '2026-10-01',
    };
    expect(repo.findAll()).toEqual([]);
    repo.save(m);
    repo.save({ ...m, firstName: 'Z' });
    expect(repo.findAll()).toHaveLength(1);
    expect(repo.findById('a')?.firstName).toBe('Z');
    expect(new LocalStorageMemberRepository(store).findById('a')).toBeDefined();
  });
});

describe('formatMemberSummary', () => {
  it('formats last, first, plan and expiration', () => {
    const plan = new PlanCatalog().get('annual');
    const m: Member = {
      id: 'a', firstName: 'Sawyer', lastName: 'Hess', email: 's@h.co', planId: 'annual', startDate: '2026-10-01',
    };
    expect(formatMemberSummary(m, plan)).toBe('Hess, Sawyer (Annual) expires 2027-10-01');
  });
});
