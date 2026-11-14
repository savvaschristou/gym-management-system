/**
 * INTEGRATION TESTS: the StaffTools screen wired to the real StaffService and
 * real localStorage repositories (over fakeStorage). Each test goes through
 * the UI, the service rules and the stored data together.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalStorageRepository } from '../data/LocalStorageRepository';
import { LocalStorageUserRepository } from '../data/LocalStorageUserRepository';
import type { SessionUser } from '../domain/auth/User';
import type { CheckIn, Membership, MembershipPlan } from '../domain/types';
import { StaffService } from '../services/staff/StaffService';
import { fakeStorage } from '../testUtils';
import StaffTools from '../ui/StaffTools';

const TODAY = '2026-11-13';
const staff: SessionUser = { id: 's1', email: 'staff@demo.gym', displayName: 'Demo Staff', role: 'staff' };

function renderStaffTools() {
  const storage = fakeStorage();
  const users = new LocalStorageUserRepository(storage);
  const plans = new LocalStorageRepository<MembershipPlan>('plans', storage);
  const memberships = new LocalStorageRepository<Membership>('memberships', storage);
  const checkIns = new LocalStorageRepository<CheckIn>('checkIns', storage);
  users.save({ id: 'ava', email: 'ava@example.com', displayName: 'Ava Thompson', role: 'member', passwordHash: 'h' });
  users.save({ id: 'liam', email: 'liam@example.com', displayName: 'Liam Carter', role: 'member', passwordHash: 'h' });
  plans.save({ id: 'monthly', name: 'Monthly', durationDays: 30, graceDays: 5, isActive: true });
  plans.save({ id: 'annual', name: 'Annual', durationDays: 365, graceDays: 14, isActive: true });
  memberships.save({ id: 'm1', userId: 'ava', planId: 'monthly', startDate: '2026-11-01', endDate: '2026-12-01', state: 'active' });
  const service = new StaffService(users, plans, memberships, checkIns);
  render(<StaffTools service={service} staff={staff} today={TODAY} />);
  return { checkIns, memberships };
}

describe('Integration: staff tools', () => {
  it('searching narrows the member list as staff type', () => {
    renderStaffTools();
    userEvent.type(screen.getByLabelText('Search members'), 'liam');
    expect(screen.getByText('Liam Carter')).toBeTruthy();
    expect(screen.queryByText('Ava Thompson')).toBeNull();
  });

  it('checking in an active member saves a check-in and confirms it on screen', () => {
    const { checkIns } = renderStaffTools();
    userEvent.click(screen.getByRole('button', { name: 'Check in Ava Thompson' }));
    expect(screen.getByRole('status').textContent).toBe('Ava Thompson checked in (Active)');
    expect(checkIns.findAll()).toEqual([expect.objectContaining({ memberId: 'ava', staffId: 's1' })]);
  });

  it('a member with no membership is turned away, then let in after staff assign a plan', () => {
    const { checkIns, memberships } = renderStaffTools();
    userEvent.click(screen.getByRole('button', { name: 'Check in Liam Carter' }));
    expect(screen.getByRole('status').textContent).toBe("Liam Carter can't check in: No membership on file");

    userEvent.selectOptions(screen.getByLabelText('Plan for Liam Carter'), 'annual');
    userEvent.click(screen.getByRole('button', { name: 'Assign plan to Liam Carter' }));
    expect(screen.getByRole('status').textContent).toBe('Liam Carter is now on the Annual plan until 2027-11-13');
    expect(memberships.findAll().find((m) => m.userId === 'liam')).toMatchObject({ planId: 'annual', endDate: '2027-11-13' });
    expect(screen.getByText('Annual, Active (ends 2027-11-13)')).toBeTruthy();

    userEvent.click(screen.getByRole('button', { name: 'Check in Liam Carter' }));
    expect(checkIns.findAll()).toHaveLength(1);
  });
});
