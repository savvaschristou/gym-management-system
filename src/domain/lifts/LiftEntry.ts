export interface LiftEntry {
  id: string;
  memberId: string;
  exercise: string;
  /** Weight in pounds. */
  weight: number;
  reps: number;
  /** ISO date, YYYY-MM-DD. */
  date: string;
}
