/**
 * OWNER: Elif
 *
 * Set up with: new InMemoryUserRepository(), new Sha256PasswordHasher(),
 * and new AuthSession(new LocalAuthProvider(users, hasher)) sharing the
 * same repository and hasher. LocalAuthProvider.test.ts shows the pattern.
 */
describe('SignUpService', () => {
  it.todo('creates a member account and signs the new user in');
  it.todo('rejects an email that is already registered');
  it.todo('rejects a password shorter than 8 characters');
  it.todo('rejects passwords that do not match');
  it.todo('stores a hash, never the plain password');
});

export {};
