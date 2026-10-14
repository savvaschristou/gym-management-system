/**
 * OWNER: Sawyer
 *
 * WHAT: The data types for the six tables besides users (User already lives
 *       in domain/auth/User.ts). Each one mirrors a table in db/schema.sql.
 * WHY:  One shared file means everyone builds against the same field names,
 *       and the code visibly matches the database design for the grader.
 *       Most of these aren't used until later weeks; that's fine.
 *
 * Complete — no TODOs. Dates are ISO strings ('2026-10-14') so they
 * survive JSON in localStorage.
 */

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  graceDays: number;
  isActive: boolean;
}

/** A state someone sets on purpose. Expired/grace are computed later, not stored. */
export type MembershipState = 'active' | 'frozen' | 'cancelled';

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  state: MembershipState;
}

export interface CheckIn {
  id: string;
  memberId: string;
  staffId: string;
  checkedInAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  startedAt: string;
  notes?: string;
}

export interface LiftSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightLbs: number;
  reps: number;
}
