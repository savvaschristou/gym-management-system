import type { UserRepository } from '../../data/UserRepository';
import type { SessionUser } from '../../domain/auth/User';
import type { AuthSession } from './AuthSession';
import type { PasswordHasher } from './PasswordHasher';

/**
 * OWNER: Elif
 *
 * WHAT: Creates a new member account, then signs them in.
 * WHY:  Keeps SignUpPage a plain form (same idea as Login + LoginValidator).
 *       Everything it needs is passed into the constructor, so the tests can
 *       use InMemoryUserRepository instead of the browser.
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

export class SignUpService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly session: AuthSession
  ) {}

  /**
   * TODO:
   *  1. Collect errors (return { ok: false, errors } if there are any):
   *     - blank name                 -> 'Enter your name'
   *     - bad email (reuse the regex in LoginValidator) -> 'Enter a valid email'
   *     - password under 8 characters -> 'Password must be at least 8 characters'
   *     - passwords don't match      -> 'Passwords do not match'
   *     - users.findByEmail finds one -> 'An account with that email already exists'
   *  2. Save a new User: id = crypto.randomUUID(), email trimmed and
   *     lower-cased, role 'member' (sign-up never makes staff),
   *     passwordHash = await hasher.hash(password).
   *  3. const user = await session.signIn(email, password), then
   *     return { ok: true, user }.
   *
   * Step 3 needs the app to use LocalAuthProvider (Savvas's App.js change).
   */
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    throw new Error('TODO: signUp');
  }
}
