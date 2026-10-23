import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SessionUser } from '../domain/auth/User';
import ProtectedRoute from './ProtectedRoute';

const member: SessionUser = { id: 'm1', email: 'm@demo.gym', displayName: 'Member', role: 'member' };
const staff: SessionUser = { id: 's1', email: 's@demo.gym', displayName: 'Staff', role: 'staff' };

/** Opens /admin (a staff page) as the given user and returns what renders. */
function openAdminAs(user: SessionUser | null) {
  render(
    <MemoryRouter initialEntries={['/admin']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/dashboard" element={<h1>Member home</h1>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} role="staff">
              <h1>Staff home</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('sends a signed-out user to /login', () => {
    openAdminAs(null);
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeTruthy();
  });

  it('sends a member who opens /admin to /dashboard', () => {
    openAdminAs(member);
    expect(screen.getByRole('heading', { name: 'Member home' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Staff home' })).toBeNull();
  });

  it('shows the page to a user with the right role', () => {
    openAdminAs(staff);
    expect(screen.getByRole('heading', { name: 'Staff home' })).toBeTruthy();
  });
});
