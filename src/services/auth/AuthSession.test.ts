import { AuthSession } from './AuthSession';
import { DemoAuthProvider } from './DemoAuthProvider';

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
