import { render, screen } from '@testing-library/react';
import type { Membership, MembershipPlan } from '../domain/types';
import MembershipCard from './MembershipCard';

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

describe('MembershipCard', () => {
  it('shows Active and the end date for a current membership', () => {
    render(<MembershipCard membership={membership} plan={plan} today="2026-10-15" />);
    expect(screen.getByText('Monthly')).toBeTruthy();
    expect(screen.getByText('Status: Active')).toBeTruthy();
    expect(screen.getByText('Ends 2026-10-31')).toBeTruthy();
  });

  it('shows Grace period the day after the end date when the plan has grace days', () => {
    render(<MembershipCard membership={membership} plan={plan} today="2026-11-01" />);
    expect(screen.getByText('Status: Grace period')).toBeTruthy();
  });

  it('shows Expired after the grace days run out', () => {
    render(<MembershipCard membership={membership} plan={plan} today="2026-11-06" />);
    expect(screen.getByText('Status: Expired')).toBeTruthy();
  });

  it('shows "No membership yet" when there is no membership', () => {
    render(<MembershipCard membership={null} plan={null} today="2026-10-15" />);
    expect(screen.getByText('No membership yet')).toBeTruthy();
    expect(screen.queryByText(/Status:/)).toBeNull();
  });
});
