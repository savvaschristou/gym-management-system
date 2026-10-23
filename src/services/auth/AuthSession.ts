import type { SessionUser } from '../../domain/auth/User';
import type { AuthProvider } from './AuthProvider';

export type AuthListener = (user: SessionUser | null) => void;

/** Anything shaped like localStorage. Tests pass a small fake. */
export type SessionStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const SESSION_KEY = 'gym.session';

/**
 * STRATEGY: the constructor takes an AuthProvider, so how sign-in works is
 * injected and can be swapped without changing this class.
 *
 * OBSERVER: this class is the subject. subscribe() registers listeners,
 * and signIn()/signOut() notify them when the current user changes.
 *
 * Staying signed in: when a store is passed in (App passes localStorage),
 * the signed-in user is saved under 'gym.session' and read back when the
 * app starts, so a page refresh keeps you signed in. Without a store the
 * session lives in memory only, which keeps tests independent.
 */
export class AuthSession {
  private user: SessionUser | null = null;
  private readonly listeners = new Set<AuthListener>();

  constructor(
    private readonly provider: AuthProvider,
    private readonly store?: SessionStore
  ) {
    this.user = this.restore();
  }

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
      this.store?.setItem(SESSION_KEY, JSON.stringify(user));
      this.notify();
    }
    return user;
  }

  signOut(): void {
    this.user = null;
    this.store?.removeItem(SESSION_KEY);
    this.notify();
  }

  /** Reads the saved user; a missing or corrupted value means signed out. */
  private restore(): SessionUser | null {
    const saved = this.store?.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as SessionUser;
    } catch {
      return null;
    }
  }

  private notify(): void {
    Array.from(this.listeners).forEach((l) => l(this.user));
  }
}
