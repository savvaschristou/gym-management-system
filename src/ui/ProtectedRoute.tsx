import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROLE_HOME } from '../domain/auth/roleHome';
import type { Role, SessionUser } from '../domain/auth/User';

/**
 * WHAT: Wraps a page so only signed-in users with the right role see it.
 *         <ProtectedRoute user={user} role="staff"><StaffHome /></ProtectedRoute>
 * WHY:  One reusable guard instead of an if-statement on every page.
 *       Signed-out users go to /login; anyone with the wrong role goes to
 *       their own home page (ROLE_HOME).
 */
interface ProtectedRouteProps {
  user: SessionUser | null;
  role: Role;
  children: ReactNode;
}

export default function ProtectedRoute({ user, role, children }: ProtectedRouteProps) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}
