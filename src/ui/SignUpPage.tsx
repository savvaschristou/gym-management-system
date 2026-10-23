import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { SignUpService } from '../services/auth/SignUpService';

/**
 * WHAT: The sign-up form at /signup.
 * WHY:  Same rules as Login.tsx: this component only handles the inputs and
 *       shows errors. SignUpService does the checking and saving. On
 *       success the session notifies App, and the routes send the new
 *       member to /dashboard.
 */
interface SignUpPageProps {
  signUpService: SignUpService;
}

export default function SignUpPage({ signUpService }: SignUpPageProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await signUpService.signUp({ displayName, email, password, confirmPassword });
    setErrors(result.ok ? [] : result.errors);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1>Create an account</h1>
      <div>
        <label htmlFor="name">Name</label>{' '}
        <input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="signup-email">Email</label>{' '}
        <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="signup-password">Password</label>{' '}
        <input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label htmlFor="confirm-password">Confirm password</label>{' '}
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <button type="submit">Sign up</button>
      {errors.map((err) => (
        <p key={err} role="alert">{err}</p>
      ))}
      <p>
        <Link to="/login">Already have an account? Log in</Link>
      </p>
    </form>
  );
}
