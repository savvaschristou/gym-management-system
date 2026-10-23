import { membershipStatus } from './membership';
import type { Membership, MembershipPlan } from './types';

// A monthly plan with 5 grace days, and a membership that ends Oct 31.
const plan: MembershipPlan = { id: 'monthly', name: 'Monthly', durationDays: 30, graceDays: 5, isActive: true };
const membership: Membership = {
  id: 'm1',
  userId: 'u1',
  planId: 'monthly',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  state: 'active',
};

describe('membershipStatus', () => {
  // Normal cases
  it('is active before the end date', () => {
    expect(membershipStatus(membership, plan, '2026-10-15')).toBe('active');
  });

  it('is frozen whatever the dates say', () => {
    expect(membershipStatus({ ...membership, state: 'frozen' }, plan, '2026-10-15')).toBe('frozen');
  });

  it('is cancelled whatever the dates say', () => {
    expect(membershipStatus({ ...membership, state: 'cancelled' }, plan, '2026-10-15')).toBe('cancelled');
  });

  // Edge cases: the boundaries between active, grace and expired
  it('is still active on the end date itself', () => {
    expect(membershipStatus(membership, plan, '2026-10-31')).toBe('active');
  });

  it('is in grace the day after the end date', () => {
    expect(membershipStatus(membership, plan, '2026-11-01')).toBe('grace');
  });

  it('is in grace on the last grace day', () => {
    expect(membershipStatus(membership, plan, '2026-11-05')).toBe('grace');
  });

  it('is expired the day after the grace days run out', () => {
    expect(membershipStatus(membership, plan, '2026-11-06')).toBe('expired');
  });

  it('goes straight to expired when the plan has no grace days', () => {
    expect(membershipStatus(membership, { ...plan, graceDays: 0 }, '2026-11-01')).toBe('expired');
  });

  // Error case
  it('throws a clear error for a date that is not YYYY-MM-DD', () => {
    expect(() => membershipStatus(membership, plan, 'next tuesday')).toThrow('Invalid date: next tuesday');
  });
});
