import { DemoAuthProvider } from './DemoAuthProvider';

describe('DemoAuthProvider', () => {
  const provider = new DemoAuthProvider();

  it('signs in the demo member', async () => {
    const user = await provider.signIn('member@demo.gym', 'demo123');
    expect(user?.role).toBe('member');
    expect(user?.displayName).toBe('Demo Member');
  });

  it('signs in the demo staff', async () => {
    const user = await provider.signIn('staff@demo.gym', 'demo123');
    expect(user?.role).toBe('staff');
    expect(user?.displayName).toBe('Demo Staff');
  });

  it('returns null for a wrong password', async () => {
    expect(await provider.signIn('member@demo.gym', 'wrong')).toBeNull();
  });
});
