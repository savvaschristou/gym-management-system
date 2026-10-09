export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  planId: string;
  /** ISO date, YYYY-MM-DD. */
  startDate: string;
}

export interface NewMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  planId: string;
}
