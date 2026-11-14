import type { Role, SessionUser } from '../../domain/auth/User';
import type { AuthProvider } from './AuthProvider';

export interface DemoAccount {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

/** Exported so the login screen can show them as hints. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'member@demo.gym', password: 'demo123', displayName: 'Demo Member', role: 'member' },
  { email: 'staff@demo.gym', password: 'demo123', displayName: 'Demo Staff', role: 'staff' },
];

/** Strategy: fixed demo accounts, no storage needed. */
export class DemoAuthProvider implements AuthProvider {
  readonly name = 'demo';

  /** Nothing to wait for here, but AuthProvider's signIn is async, so return a resolved promise. */
  signIn(email: string, password: string): Promise<SessionUser | null> {
    const wanted = email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find((a) => a.email === wanted && a.password === password);
    if (!account) return Promise.resolve(null);
    return Promise.resolve({
      id: `demo-${account.role}`,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
    });
  }
}
