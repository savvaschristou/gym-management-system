import { useState } from 'react';
import type { FormEvent } from 'react';
import { DEMO_ACCOUNTS } from './services/auth/DemoAuthProvider';
import type { AuthSession } from './services/auth/AuthSession';
import type { LoginValidator } from './services/auth/LoginValidator';

interface LoginProps {
  session: AuthSession;
  validator: LoginValidator;
}

/**
 * Compared with examples/before/Login.before.tsx:
 *  [S] The component only handles the form. Validation is LoginValidator's
 *      job and credential checking is the session/provider's job.
 *  [O] A new sign-in method or role needs no change here; the session is
 *      injected and the destination is decided by the parent (ROLE_HOME).
 *  [D] It depends on the AuthSession and LoginValidator abstractions it is
 *      given, with no localStorage or window.location.
 */
export default function Login({ session, validator }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validator.validate({ email, password });
    if (found.length > 0) {
      setErrors(found);
      return;
    }
    const user = await session.signIn(email, password);
    setErrors(user ? [] : ['Wrong email or password']);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1>Gym Login</h1>
      <div>
        <label htmlFor="email">Email</label>{' '}
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password">Password</label>{' '}
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit">Log in</button>
      {errors.map((err) => (
        <p key={err} role="alert">{err}</p>
      ))}
      <div>
        <p>Demo accounts:</p>
        <ul>
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>{a.email} / {a.password} ({a.role})</li>
          ))}
        </ul>
      </div>
    </form>
  );
}
