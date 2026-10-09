import type { Role } from './User';

export const ROLE_HOME: Record<Role, string> = {
  member: '/dashboard',
  staff: '/admin',
};
