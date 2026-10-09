import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { AuthSession } from './services/auth/AuthSession';
import { DemoAuthProvider } from './services/auth/DemoAuthProvider';
import { LoginValidator } from './services/auth/LoginValidator';

function setup() {
  const session = new AuthSession(new DemoAuthProvider());
  const signIn = jest.spyOn(session, 'signIn');
  render(<Login session={session} validator={new LoginValidator()} />);
  return { session, signIn };
}

function fill(email: string, password: string) {
  userEvent.type(screen.getByLabelText('Email'), email);
  userEvent.type(screen.getByLabelText('Password'), password);
  userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('Login', () => {
  it('shows validation errors without calling signIn', async () => {
    const { signIn } = setup();
    fill('nope', '123');
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows an error for wrong credentials', async () => {
    const { signIn } = setup();
    fill('member@demo.gym', 'wrong-password');
    expect(await screen.findByText('Wrong email or password')).toBeTruthy();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('calls signIn for correct demo credentials', async () => {
    const { session, signIn } = setup();
    fill('staff@demo.gym', 'demo123');
    await waitFor(() => expect(session.currentUser?.role).toBe('staff'));
    expect(signIn).toHaveBeenCalledWith('staff@demo.gym', 'demo123');
    expect(screen.queryByText('Wrong email or password')).toBeNull();
  });
});
