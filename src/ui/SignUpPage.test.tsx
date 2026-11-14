import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { SignUpService } from '../services/auth/SignUpService';
import SignUpPage from './SignUpPage';

function renderWith(signUp: SignUpService['signUp']) {
  const service = { signUp } as unknown as SignUpService;
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SignUpPage signUpService={service} />
    </MemoryRouter>
  );
  userEvent.click(screen.getByRole('button', { name: 'Sign up' }));
}

describe('SignUpPage', () => {
  it('shows the errors the service returns', async () => {
    renderWith(() => Promise.resolve({ ok: false, errors: ['Enter your name'] }));
    expect(await screen.findByText('Enter your name')).toBeTruthy();
  });

  it('shows a friendly error instead of crashing when sign-up throws', async () => {
    renderWith(() => Promise.reject(new Error('storage full')));
    expect(await screen.findByText('Something went wrong creating your account. Please try again.')).toBeTruthy();
  });
});
