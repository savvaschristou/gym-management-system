import type { UserRepository } from '../../data/UserRepository';
import type { SessionUser } from '../../domain/auth/User';
import type { AuthProvider } from './AuthProvider';
import type { PasswordHasher } from './PasswordHasher';

/** Strategy: checks credentials against users in a repository. */
export class LocalAuthProvider implements AuthProvider {
  readonly name = 'local';

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async signIn(email: string, password: string): Promise<SessionUser | null> {
    const user = this.users.findByEmail(email.trim().toLowerCase());
    if (!user) return null;
    const hash = await this.hasher.hash(password);
    if (hash !== user.passwordHash) return null;
    const { passwordHash, ...sessionUser } = user;
    return sessionUser;
  }
}
