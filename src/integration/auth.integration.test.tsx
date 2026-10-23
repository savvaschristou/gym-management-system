/**
 * INTEGRATION TESTS: each test wires real classes together across layers
 * (UI -> service -> data) instead of testing one class alone. The only
 * stand-ins are the browser pieces Jest doesn't have: storage (fakeStorage)
 * and password hashing (fakeHasher).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LocalStorageUserRepository } from '../data/LocalStorageUserRepository';
import { AuthSession } from '../services/auth/AuthSession';
import { LocalAuthProvider } from '../services/auth/LocalAuthProvider';
import { SignUpService } from '../services/auth/SignUpService';
import { fakeHasher, fakeStorage } from '../testUtils';
import SignUpPage from '../ui/SignUpPage';

/** Builds the app's real object graph over one shared fake storage. */
function buildApp(storage = fakeStorage()) {
  const users = new LocalStorageUserRepository(storage);
  const session = new AuthSession(new LocalAuthProvider(users, fakeHasher), storage);
  const signUp = new SignUpService(users, fakeHasher, session);
  return { storage, users, session, signUp };
}

const ada = { displayName: 'Ada', email: 'ada@example.com', password: 'password1', confirmPassword: 'password1' };

describe('Integration: sign up, sign in and sessions', () => {
  it('a member who signs up can sign out and log back in with the same password', async () => {
    const { session, signUp } = buildApp();
    await signUp.signUp(ada);
    session.signOut();

    const user = await session.signIn('ada@example.com', 'password1');
    expect(user).toMatchObject({ email: 'ada@example.com', role: 'member' });
  });

  it('a user saved through the data layer can sign in through the service layer', async () => {
    const storage = fakeStorage();
    new LocalStorageUserRepository(storage).save({
      id: 'u1',
      email: 'staff@demo.gym',
      displayName: 'Staff',
      role: 'staff',
      passwordHash: await fakeHasher.hash('demo123'),
    });
    const { session } = buildApp(storage);

    expect(await session.signIn('staff@demo.gym', 'demo123')).toMatchObject({ role: 'staff' });
    expect(await session.signIn('staff@demo.gym', 'wrong')).toBeNull();
  });

  it('an email used once is rejected later, even through a separately built app', async () => {
    const storage = fakeStorage();
    await buildApp(storage).signUp.signUp(ada);

    // A second app over the same storage, like a second browser tab.
    const result = await buildApp(storage).signUp.signUp({ ...ada, displayName: 'Ada Again' });
    expect(result).toEqual({ ok: false, errors: ['An account with that email already exists'] });
  });

  it('a signed-in user is still signed in after a page refresh, until they sign out', async () => {
    const storage = fakeStorage();
    await buildApp(storage).signUp.signUp(ada);

    const afterRefresh = buildApp(storage); // the app starting again
    expect(afterRefresh.session.currentUser).toMatchObject({ email: 'ada@example.com' });

    afterRefresh.session.signOut();
    expect(buildApp(storage).session.currentUser).toBeNull();
  });

  it('filling in the sign-up form creates the account and signs the member in', async () => {
    const { session, users, signUp } = buildApp();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SignUpPage signUpService={signUp} />
      </MemoryRouter>
    );

    userEvent.type(screen.getByLabelText('Name'), 'Ada');
    userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    userEvent.type(screen.getByLabelText('Password'), 'password1');
    userEvent.type(screen.getByLabelText('Confirm password'), 'password1');
    userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => expect(session.currentUser?.email).toBe('ada@example.com'));
    expect(users.findByEmail('ada@example.com')?.role).toBe('member');
  });

  it('the sign-up form shows the errors the service returns and saves nothing', async () => {
    const { users, signUp } = buildApp();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SignUpPage signUpService={signUp} />
      </MemoryRouter>
    );

    userEvent.type(screen.getByLabelText('Name'), 'Ada');
    userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    userEvent.type(screen.getByLabelText('Password'), 'short');
    userEvent.type(screen.getByLabelText('Confirm password'), 'different');
    userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy();
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(users.findByEmail('ada@example.com')).toBeUndefined();
  });
});
