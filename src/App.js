import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './Login';
import { LocalStorageUserRepository } from './data/LocalStorageUserRepository';
import { ROLE_HOME } from './domain/auth/roleHome';
import { AuthSession } from './services/auth/AuthSession';
import { DEMO_ACCOUNTS } from './services/auth/DemoAuthProvider';
import { LocalAuthProvider } from './services/auth/LocalAuthProvider';
import { LoginValidator } from './services/auth/LoginValidator';
import { Sha256PasswordHasher } from './services/auth/PasswordHasher';
import { SignUpService } from './services/auth/SignUpService';
import ProtectedRoute from './ui/ProtectedRoute';
import SignUpPage from './ui/SignUpPage';

// Created once at startup. This is the only place that picks the real
// classes; everything else receives them (dependency injection).
const users = new LocalStorageUserRepository();
const hasher = new Sha256PasswordHasher();
const session = new AuthSession(new LocalAuthProvider(users, hasher), window.localStorage);
const validator = new LoginValidator();
const signUpService = new SignUpService(users, hasher, session);

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

function Home({ title, user }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Signed in as {user.displayName} ({user.role})</p>
      <button onClick={() => session.signOut()}>Sign out</button>
    </div>
  );
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
              <Home title="Member home" user={user} />
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
