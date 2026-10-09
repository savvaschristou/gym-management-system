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
