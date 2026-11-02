import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './Login';
import { LocalStorageRepository } from './data/LocalStorageRepository';
import { LocalStorageUserRepository } from './data/LocalStorageUserRepository';
import { ROLE_HOME } from './domain/auth/roleHome';
import { AuthSession } from './services/auth/AuthSession';
import { DEMO_ACCOUNTS } from './services/auth/DemoAuthProvider';
import { LocalAuthProvider } from './services/auth/LocalAuthProvider';
import { LoginValidator } from './services/auth/LoginValidator';
import { Sha256PasswordHasher } from './services/auth/PasswordHasher';
import { SignUpService } from './services/auth/SignUpService';
import MembershipCard from './ui/MembershipCard';
import ProtectedRoute from './ui/ProtectedRoute';
import SignUpPage from './ui/SignUpPage';

// Created once at startup. This is the only place that picks the real
// classes; everything else receives them (dependency injection).
const users = new LocalStorageUserRepository();
const hasher = new Sha256PasswordHasher();
const session = new AuthSession(new LocalAuthProvider(users, hasher), window.localStorage);
const validator = new LoginValidator();
const signUpService = new SignUpService(users, hasher, session);
const plans = new LocalStorageRepository('gym.membershipPlans');
const memberships = new LocalStorageRepository('gym.memberships');

/** A date as 'YYYY-MM-DD' in the user's own time zone, `daysFromNow` days ahead. */
function localDate(daysFromNow = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString('en-CA'); // en-CA formats as YYYY-MM-DD
}

// Save the demo accounts as real users the first time the app runs, so the
// demo logins work through LocalAuthProvider like any other account.
DEMO_ACCOUNTS.forEach(async (account) => {
  if (users.findByEmail(account.email)) return;
  users.save({
    id: `demo-${account.role}`,
    email: account.email,
    displayName: account.displayName,
    role: account.role,
    passwordHash: await hasher.hash(account.password),
  });
});

// Save the membership plans (same values as db/schema.sql) and give the demo
// member a monthly membership, the first time the app runs.
if (plans.findAll().length === 0) {
  plans.save({ id: 'monthly', name: 'Monthly', durationDays: 30, graceDays: 5, isActive: true });
  plans.save({ id: 'semester', name: 'Semester', durationDays: 120, graceDays: 7, isActive: true });
  plans.save({ id: 'annual', name: 'Annual', durationDays: 365, graceDays: 14, isActive: true });
}
if (!memberships.findAll().some((m) => m.userId === 'demo-member')) {
  memberships.save({
    id: 'demo-membership',
    userId: 'demo-member',
    planId: 'monthly',
    state: 'active',
    startDate: localDate(),
    endDate: localDate(30),
  });
}

function Home({ title, user, children }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Signed in as {user.displayName} ({user.role})</p>
      {children}
      <button onClick={() => session.signOut()}>Sign out</button>
    </div>
  );
}

/** The signed-in member's membership card (their first membership, if any). */
function MemberMembership({ user }) {
  const membership = memberships.findAll().find((m) => m.userId === user.id) ?? null;
  const plan = membership ? plans.findById(membership.planId) ?? null : null;
  return <MembershipCard membership={membership} plan={plan} today={localDate()} />;
}

function App() {
  const [user, setUser] = useState(session.currentUser);

  useEffect(() => session.subscribe(setUser), []);

  // Signed-in users who open /login or /signup go to their own home page.
  const homeIfSignedIn = (page) => (user ? <Navigate to={ROLE_HOME[user.role]} replace /> : page);

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={homeIfSignedIn(
            <>
              <Login session={session} validator={validator} />
              <p>
                <Link to="/signup">New here? Create an account</Link>
              </p>
            </>
          )}
        />
        <Route path="/signup" element={homeIfSignedIn(<SignUpPage signUpService={signUpService} />)} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} role="member">
              <Home title="Member home" user={user}>
                <MemberMembership user={user} />
              </Home>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} role="staff">
              <Home title="Staff home" user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
