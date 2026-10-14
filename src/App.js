import { useEffect, useState } from 'react';
import './App.css';
import Login from './Login';
import { LocalStorageUserRepository } from './data/LocalStorageUserRepository';
import { ROLE_HOME } from './domain/auth/roleHome';
import { AuthSession } from './services/auth/AuthSession';
import { DemoAuthProvider } from './services/auth/DemoAuthProvider';
import { LocalAuthProvider } from './services/auth/LocalAuthProvider';
import { LoginValidator } from './services/auth/LoginValidator';
import { Sha256PasswordHasher } from './services/auth/PasswordHasher';

// TODO (Savvas) — this week App.js becomes the wiring and the routes:
//  1. Always use LocalAuthProvider (so accounts made by sign-up can log in).
//     On startup, save the two DEMO_ACCOUNTS into the user repository with
//     hashed passwords if they aren't there yet, so the demo logins still work.
//  2. Create one SignUpService(users, hasher, session) next to `session`.
//  3. Replace the if/else in the return with <Routes>:
//       /login      -> <Login .../>        (signed in? go to ROLE_HOME[role])
//       /signup     -> <SignUpPage .../>   (signed in? go to ROLE_HOME[role])
//       /dashboard  -> <ProtectedRoute user={user} role="member"> member home
//       /admin      -> <ProtectedRoute user={user} role="staff">  staff home
//       *           -> <Navigate to="/login" replace />
//     The two home pages can be a heading plus the Sign out button for now.
//
// Created once at startup. The provider is the injected Strategy.
const provider =
  process.env.REACT_APP_AUTH_PROVIDER === 'local'
    ? new LocalAuthProvider(new LocalStorageUserRepository(), new Sha256PasswordHasher())
    : new DemoAuthProvider();
const session = new AuthSession(provider);
const validator = new LoginValidator();

function App() {
  const [user, setUser] = useState(session.currentUser);

  useEffect(() => session.subscribe(setUser), []);

  return (
    <div className="App">
      {user ? (
        <div>
          <p>Signed in as {user.displayName} ({user.role})</p>
          <p>Destination: {ROLE_HOME[user.role]}</p>
          <button onClick={() => session.signOut()}>Sign out</button>
        </div>
      ) : (
        <Login session={session} validator={validator} />
      )}
    </div>
  );
}

export default App;
