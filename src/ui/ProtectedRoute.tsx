import type { ReactNode } from 'react';
import type { Role, SessionUser } from '../domain/auth/User';

/**
 * OWNER: Chinguun
 *
 * WHAT: Wraps a page so only signed-in users with the right role see it.
 *         <ProtectedRoute user={user} role="staff"><StaffHome /></ProtectedRoute>
 * WHY:  One reusable guard instead of an if-statement on every page.
 *
 * TODO (use <Navigate to="..." replace /> from react-router-dom):
 *  - no user              -> send to /login
 *  - user.role !== role   -> send to ROLE_HOME[user.role] (their own home)
 *  - otherwise            -> show children
 *
 * Until then it shows the page to everyone, so the app keeps running.
 */
interface ProtectedRouteProps {
  user: SessionUser | null;
  role: Role;
  children: ReactNode;
}

export default function ProtectedRoute({ user, role, children }: ProtectedRouteProps) {
  return <>{children}</>;
}
