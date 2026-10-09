import type { User } from '../domain/auth/User';
import type { UserRepository } from './UserRepository';

/** Map-based repository for tests. */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  findByEmail(email: string): User | undefined {
    return this.users.get(email.toLowerCase());
  }

  save(user: User): void {
    this.users.set(user.email.toLowerCase(), user);
  }
}
