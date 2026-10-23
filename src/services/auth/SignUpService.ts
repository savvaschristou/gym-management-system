import type { UserRepository } from '../../data/UserRepository';
import type { SessionUser } from '../../domain/auth/User';
import type { AuthSession } from './AuthSession';
import type { PasswordHasher } from './PasswordHasher';

/**
 * WHAT: Creates a new member account, then signs them in.
 * WHY:  Keeps SignUpPage a plain form (same idea as Login + LoginValidator).
 *       Everything it needs is passed into the constructor, so the tests can
 *       use InMemoryUserRepository and a fake hasher instead of the browser.
 */
export interface SignUpInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type SignUpResult =
  | { ok: true; user: SessionUser }
  | { ok: false; errors: string[] };

export const MIN_PASSWORD_LENGTH = 8;

/** Unique enough for one browser; crypto.randomUUID isn't available in Jest. */
function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export class SignUpService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly session: AuthSession
  ) {}

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const email = input.email.trim().toLowerCase();
    const errors = this.validate(input, email);
    if (errors.length > 0) return { ok: false, errors };

    this.users.save({
      id: newId(),
      email,
      displayName: input.displayName.trim(),
      role: 'member', // sign-up never creates staff
      passwordHash: await this.hasher.hash(input.password),
    });

    // Sign in through the session so every listener (App) hears about it.
    const user = await this.session.signIn(email, input.password);
    if (!user) return { ok: false, errors: ['Account created, but signing in failed. Try logging in.'] };
    return { ok: true, user };
  }

  private validate(input: SignUpInput, email: string): string[] {
    const errors: string[] = [];
    if (!input.displayName.trim()) errors.push('Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Enter a valid email');
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (input.password !== input.confirmPassword) errors.push('Passwords do not match');
    if (errors.length === 0 && this.users.findByEmail(email)) {
      errors.push('An account with that email already exists');
    }
    return errors;
  }
}
