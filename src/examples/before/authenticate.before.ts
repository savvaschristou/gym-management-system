/**
 * BEFORE: authentication as one function with an if/else on a method string.
 *
 * Problems with this version:
 *  1. Every new sign-in method is another branch to edit in this function.
 *  2. The method is a magic string, so a typo only fails at runtime.
 *  3. Demo accounts and real (localStorage) logic are mixed together.
 *  4. Passwords are stored and compared as plain text.
 *
 * Nothing imports this file. See src/services/auth/ for the Strategy
 * pattern version.
 */

export interface BeforeUser {
  email: string;
  password: string;
  role: 'member' | 'staff';
}

export async function authenticate(
  method: string,
  email: string,
  password: string
): Promise<{ email: string; role: string } | null> {
  if (method === 'demo') {
    if (email === 'member@demo.gym' && password === 'demo123') {
      return { email, role: 'member' };
    }
    if (email === 'staff@demo.gym' && password === 'demo123') {
      return { email, role: 'staff' };
    }
    return null;
  } else if (method === 'local') {
    const users: BeforeUser[] = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u) => u.email === email && u.password === password);
    return user ? { email: user.email, role: user.role } : null;
  }
  throw new Error(`Unknown auth method: ${method}`);
}
