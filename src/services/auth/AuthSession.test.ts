import { AuthSession } from './AuthSession';
import { DemoAuthProvider } from './DemoAuthProvider';
import { fakeStorage } from '../../testUtils';

describe('AuthSession', () => {
  it('notifies listeners on sign in and sign out', async () => {
    const session = new AuthSession(new DemoAuthProvider());
    const listener = jest.fn();
    session.subscribe(listener);

    const user = await session.signIn('member@demo.gym', 'demo123');
    expect(listener).toHaveBeenLastCalledWith(user);
    expect(session.currentUser).toEqual(user);

    session.signOut();
    expect(listener).toHaveBeenLastCalledWith(null);
    expect(session.currentUser).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stops calling a listener after unsubscribe', async () => {
    const session = new AuthSession(new DemoAuthProvider());
    const listener = jest.fn();
    const unsubscribe = session.subscribe(listener);
    unsubscribe();
    await session.signIn('member@demo.gym', 'demo123');
    expect(listener).not.toHaveBeenCalled();
  });

  it('leaves currentUser null after a failed sign in', async () => {
    const session = new AuthSession(new DemoAuthProvider());
    const listener = jest.fn();
    session.subscribe(listener);
    expect(await session.signIn('member@demo.gym', 'bad')).toBeNull();
    expect(session.currentUser).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('AuthSession remembers the user', () => {
  const saved = { id: 'demo-member', email: 'member@demo.gym', displayName: 'Demo Member', role: 'member' };

  it('restores the saved user when a new AuthSession is created (page refresh)', () => {
    const store = fakeStorage({ 'gym.session': JSON.stringify(saved) });
    const session = new AuthSession(new DemoAuthProvider(), store);
    expect(session.currentUser).toEqual(saved);
  });

  it('saves the user on sign in', async () => {
    const store = fakeStorage();
    const session = new AuthSession(new DemoAuthProvider(), store);
    const user = await session.signIn('member@demo.gym', 'demo123');
    expect(JSON.parse(store.raw('gym.session')!)).toEqual(user);
  });

  it('forgets the user on sign out', async () => {
    const store = fakeStorage();
    const session = new AuthSession(new DemoAuthProvider(), store);
    await session.signIn('member@demo.gym', 'demo123');
    session.signOut();
    expect(store.raw('gym.session')).toBeUndefined();
  });

  it('starts signed out when the saved session is corrupted', () => {
    const store = fakeStorage({ 'gym.session': '{not valid json' });
    const session = new AuthSession(new DemoAuthProvider(), store);
    expect(session.currentUser).toBeNull();
  });
});
