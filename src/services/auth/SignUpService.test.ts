import { InMemoryUserRepository } from '../../data/InMemoryUserRepository';
import { fakeHasher } from '../../testUtils';
import { AuthSession } from './AuthSession';
import { LocalAuthProvider } from './LocalAuthProvider';
import { SignUpService } from './SignUpService';

function setup() {
  const users = new InMemoryUserRepository();
  const session = new AuthSession(new LocalAuthProvider(users, fakeHasher));
  return { users, session, service: new SignUpService(users, fakeHasher, session) };
}

const valid = {
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'password1',
  confirmPassword: 'password1',
};

describe('SignUpService', () => {
  // Normal case
  it('creates a member account and signs the new user in', async () => {
    const { session, service } = setup();
    const result = await service.signUp(valid);
    expect(result.ok).toBe(true);
    expect(session.currentUser).toMatchObject({ email: 'ada@example.com', role: 'member' });
  });

  // Error case
  it('rejects an email that is already registered', async () => {
    const { service } = setup();
    await service.signUp(valid);
    const second = await service.signUp({ ...valid, email: '  ADA@example.com ' });
    expect(second).toEqual({ ok: false, errors: ['An account with that email already exists'] });
  });

  // Edge cases: 7 characters fails, exactly 8 passes
  it('rejects a password shorter than 8 characters', async () => {
    const { service } = setup();
    const short = await service.signUp({ ...valid, password: 'pass123', confirmPassword: 'pass123' });
    expect(short).toEqual({ ok: false, errors: ['Password must be at least 8 characters'] });
    const exact = await service.signUp({ ...valid, password: 'pass1234', confirmPassword: 'pass1234' });
    expect(exact.ok).toBe(true);
  });

  // Error case
  it('rejects passwords that do not match', async () => {
    const { users, service } = setup();
    const result = await service.signUp({ ...valid, confirmPassword: 'password2' });
    expect(result).toEqual({ ok: false, errors: ['Passwords do not match'] });
    expect(users.findByEmail('ada@example.com')).toBeUndefined();
  });

  // Normal case (security)
  it('stores a hash, never the plain password', async () => {
    const { users, service } = setup();
    await service.signUp(valid);
    expect(users.findByEmail('ada@example.com')?.passwordHash).toBe('hashed:password1');
  });

  // Error case: every problem reported at once
  it('reports every problem at once for an empty form', async () => {
    const { service } = setup();
    const result = await service.signUp({ displayName: ' ', email: 'nope', password: '', confirmPassword: 'x' });
    expect(result).toEqual({
      ok: false,
      errors: [
        'Enter your name',
        'Enter a valid email',
        'Password must be at least 8 characters',
        'Passwords do not match',
      ],
    });
  });
});
