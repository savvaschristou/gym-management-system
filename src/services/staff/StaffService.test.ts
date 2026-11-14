import { LocalStorageRepository } from '../../data/LocalStorageRepository';
import { LocalStorageUserRepository } from '../../data/LocalStorageUserRepository';
import type { SessionUser } from '../../domain/auth/User';
import type { CheckIn, Membership, MembershipPlan } from '../../domain/types';
import { fakeStorage } from '../../testUtils';
import { NotAuthorizedError, StaffService } from './StaffService';

const TODAY = '2026-11-13';
const staff: SessionUser = { id: 's1', email: 'staff@demo.gym', displayName: 'Demo Staff', role: 'staff' };
const memberUser = (id: string, displayName: string) => ({
  id,
  displayName,
  email: `${displayName.split(' ')[0].toLowerCase()}@example.com`,
  role: 'member' as const,
  passwordHash: 'hash',
});
const monthly: MembershipPlan = { id: 'monthly', name: 'Monthly', durationDays: 30, graceDays: 5, isActive: true };
const summer: MembershipPlan = { id: 'summer', name: 'Summer Pass', durationDays: 90, graceDays: 3, isActive: false };
const membership = (userId: string, endDate: string, state: Membership['state'] = 'active'): Membership => ({
  id: `m-${userId}`,
  userId,
  planId: 'monthly',
  startDate: '2026-10-01',
  endDate,
  state,
});

function setup() {
  const storage = fakeStorage();
  const users = new LocalStorageUserRepository(storage);
  const plans = new LocalStorageRepository<MembershipPlan>('plans', storage);
  const memberships = new LocalStorageRepository<Membership>('memberships', storage);
  const checkIns = new LocalStorageRepository<CheckIn>('checkIns', storage);
  [memberUser('ava', 'Ava Thompson'), memberUser('liam', 'Liam Carter'), memberUser('mia', 'Mia Coleman')].forEach((u) =>
    users.save(u)
  );
  users.save({ ...staff, passwordHash: 'hash' });
  plans.save(monthly);
  plans.save(summer);
  return { service: new StaffService(users, plans, memberships, checkIns), memberships, checkIns };
}

describe('StaffService', () => {
  describe('searchMembers', () => {
    it('finds members by part of their name, ignoring case', () => {
      const { service } = setup();
      expect(service.searchMembers(staff, 'LIAM', TODAY).map((r) => r.member.displayName)).toEqual(['Liam Carter']);
    });

    it('lists every member, sorted by name, when the search is empty, and never includes staff', () => {
      const { service } = setup();
      expect(service.searchMembers(staff, '  ', TODAY).map((r) => r.member.displayName)).toEqual([
        'Ava Thompson',
        'Liam Carter',
        'Mia Coleman',
      ]);
    });

    it('includes each member\'s status but never their password hash', () => {
      const { service, memberships } = setup();
      memberships.save(membership('ava', '2026-11-30'));
      const [ava] = service.searchMembers(staff, 'ava', TODAY);
      expect(ava.status).toBe('active');
      expect(ava.member).not.toHaveProperty('passwordHash');
    });
  });

  describe('checkIn', () => {
    it('lets in a member with an active membership and records which staff member did it', () => {
      const { service, memberships, checkIns } = setup();
      memberships.save(membership('ava', '2026-11-30'));
      const result = service.checkIn(staff, 'ava', TODAY, new Date('2026-11-13T18:00:00Z'));
      expect(result).toMatchObject({ ok: true, status: 'active' });
      expect(checkIns.findAll()).toEqual([expect.objectContaining({ memberId: 'ava', staffId: 's1' })]);
    });

    it('lets in a member during the grace period', () => {
      const { service, memberships } = setup();
      memberships.save(membership('ava', '2026-11-10')); // 3 days ago; Monthly has 5 grace days
      expect(service.checkIn(staff, 'ava', TODAY)).toMatchObject({ ok: true, status: 'grace' });
    });

    it('turns away an expired membership and records nothing', () => {
      const { service, memberships, checkIns } = setup();
      memberships.save(membership('ava', '2026-11-01'));
      expect(service.checkIn(staff, 'ava', TODAY)).toEqual({ ok: false, reason: 'Membership expired on 2026-11-01' });
      expect(checkIns.findAll()).toEqual([]);
    });

    it('turns away a cancelled membership and records nothing', () => {
      const { service, memberships, checkIns } = setup();
      memberships.save(membership('ava', '2026-11-30', 'cancelled'));
      expect(service.checkIn(staff, 'ava', TODAY)).toEqual({ ok: false, reason: 'Membership is cancelled' });
      expect(checkIns.findAll()).toHaveLength(0);
    });

    it('turns away frozen memberships and members with no membership', () => {
      const { service, memberships } = setup();
      memberships.save(membership('ava', '2026-11-30', 'frozen'));
      expect(service.checkIn(staff, 'ava', TODAY)).toEqual({ ok: false, reason: 'Membership is frozen' });
      expect(service.checkIn(staff, 'liam', TODAY)).toEqual({ ok: false, reason: 'No membership on file' });
    });
  });

  describe('assignPlan', () => {
    it('starts a new membership today that ends after the plan length', () => {
      const { service } = setup();
      expect(service.assignPlan(staff, 'liam', 'monthly', TODAY)).toMatchObject({
        userId: 'liam',
        startDate: '2026-11-13',
        endDate: '2026-12-13',
        state: 'active',
      });
      expect(service.searchMembers(staff, 'liam', TODAY)[0].status).toBe('active');
    });

    it('replaces an expired membership as the current one, keeping the old one as history', () => {
      const { service, memberships } = setup();
      memberships.save(membership('ava', '2026-11-01'));
      service.assignPlan(staff, 'ava', 'monthly', TODAY);
      expect(memberships.findAll().filter((m) => m.userId === 'ava')).toHaveLength(2);
      expect(service.checkIn(staff, 'ava', TODAY)).toMatchObject({ ok: true, status: 'active' });
    });

    it('refuses a plan that is no longer sold, or a member who does not exist', () => {
      const { service } = setup();
      expect(() => service.assignPlan(staff, 'ava', 'summer', TODAY)).toThrow('That plan is not available');
      expect(() => service.assignPlan(staff, 'nobody', 'monthly', TODAY)).toThrow('No member with that id');
    });

    it('only offers plans that are still sold', () => {
      const { service } = setup();
      expect(service.activePlans(staff).map((p) => p.name)).toEqual(['Monthly']);
    });
  });

  it('refuses every staff action when the caller is a member (ADR-004)', () => {
    const { service } = setup();
    const member: SessionUser = { id: 'ava', email: 'ava@example.com', displayName: 'Ava Thompson', role: 'member' };
    expect(() => service.searchMembers(member, '', TODAY)).toThrow(NotAuthorizedError);
    expect(() => service.checkIn(member, 'liam', TODAY)).toThrow(NotAuthorizedError);
    expect(() => service.assignPlan(member, 'ava', 'monthly', TODAY)).toThrow(NotAuthorizedError);
  });
});
