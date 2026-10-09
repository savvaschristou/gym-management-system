import type { SessionUser } from '../../domain/auth/User';

/**
 * STRATEGY PATTERN: each way of signing in is its own AuthProvider.
 *
 * Compared with authenticate.before.ts:
 *  - A new sign-in method is a new class; no existing code is edited.
 *  - Callers receive a provider object, not a magic string, so the
 *    compiler catches mistakes.
 *  - Demo and real logic live in separate classes.
 *
 * Contract: providers return null for bad credentials and never throw
 * for that.
 */
export interface AuthProvider {
  readonly name: string;
  signIn(email: string, password: string): Promise<SessionUser | null>;
}
