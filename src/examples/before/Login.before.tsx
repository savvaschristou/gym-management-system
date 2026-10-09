/**
 * BEFORE: a deliberately flawed Login component.
 *
 *  [S] Single Responsibility: one handler validates, looks up users,
 *      checks passwords, stores the session, and navigates.
 *  [O] Open/Closed: role-to-page rules are hard-coded in an if, so a new
 *      role or sign-in method means editing this component.
 *  [D] Dependency Inversion: the component talks directly to localStorage
 *      and window.location, so it can't be tested or swapped out.
 *
 * Nothing imports this file. See src/Login.tsx for the refactor.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

export default function LoginBefore() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // [S] validation inside the submit handler
    if (!email.includes('@')) return setError('Enter a valid email');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    // [D] reads users straight from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // [S] [D] credential check with plain text passwords
    const user = users.find(
      (u: { email: string; password: string }) =>
        u.email === email && u.password === password
    );
    if (!user) return setError('Wrong email or password');

    // [D] session stored directly in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));

    // [O] [D] role rules hard-coded, navigation hard-wired to window
    if (user.role === 'staff') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Log in</button>
      {error && <p>{error}</p>}
    </form>
  );
}
