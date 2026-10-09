export type Role = 'member' | 'staff';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  passwordHash: string;
}

export type SessionUser = Omit<User, 'passwordHash'>;
