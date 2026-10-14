import type { SessionUser } from '../../domain/auth/User';
import type { AuthProvider } from './AuthProvider';

export type AuthListener = (user: SessionUser | null) => void;

/**
 * STRATEGY: the constructor takes an AuthProvider, so how sign-in works is
 * injected and can be swapped without changing this class.
 *
 * OBSERVER: this class is the subject. subscribe() registers listeners,
 * and signIn()/signOut() notify them when the current user changes.
 *
 * TODO (Savvas) — stay signed in after a refresh:
 *  1. Add a second constructor parameter, the same way
 *     LocalStorageUserRepository takes one:
 *       private readonly store: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage
 *  2. In the constructor, read 'gym.session'; if present, JSON.parse it
 *     into this.user (wrap in try/catch in case it's corrupted).
 *  3. signIn success: store.setItem('gym.session', JSON.stringify(user)).
 *  4. signOut: store.removeItem('gym.session').
 * Existing tests keep working because the parameter has a default.
 */
export class AuthSession {
  private user: SessionUser | null = null;
  private readonly listeners = new Set<AuthListener>();

  constructor(private readonly provider: AuthProvider) {}

  get currentUser(): SessionUser | null {
    return this.user;
  }

  /** Observer: returns a function that unsubscribes the listener. */
  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Strategy: delegates to the provider. Observer: notifies on success. */
  async signIn(email: string, password: string): Promise<SessionUser | null> {
    const user = await this.provider.signIn(email, password);
    if (user) {
      this.user = user;
      this.notify();
    }
    return user;
  }

  signOut(): void {
    this.user = null;
    this.notify();
  }

  private notify(): void {
    Array.from(this.listeners).forEach((l) => l(this.user));
  }
}
