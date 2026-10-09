import { InMemoryUserRepository } from '../../data/InMemoryUserRepository';
import { LocalAuthProvider } from './LocalAuthProvider';

const hasher = { hash: async (p: string) => 'hashed:' + p };

function setup() {
  const repo = new InMemoryUserRepository();
  repo.save({
    id: 'u1',
    email: 'Sawyer@Example.com',
    displayName: 'Sawyer',
    role: 'staff',
    passwordHash: 'hashed:secret1',
  });
  return new LocalAuthProvider(repo, hasher);
}

describe('LocalAuthProvider', () => {
  it('returns the user without passwordHash for the right password', async () => {
    const user = await setup().signIn('sawyer@example.com', 'secret1');
    expect(user).toEqual({ id: 'u1', email: 'Sawyer@Example.com', displayName: 'Sawyer', role: 'staff' });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('returns null for a wrong password', async () => {
    expect(await setup().signIn('sawyer@example.com', 'nope')).toBeNull();
  });

  it('returns null for an unknown email', async () => {
    expect(await setup().signIn('who@example.com', 'secret1')).toBeNull();
  });

  it('ignores case and surrounding spaces in the email', async () => {
    expect(await setup().signIn('  SAWYER@example.COM ', 'secret1')).not.toBeNull();
  });
});
