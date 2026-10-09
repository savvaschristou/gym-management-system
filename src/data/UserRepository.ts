import type { User } from '../domain/auth/User';

/**
 * REPOSITORY PATTERN: this interface hides where users are stored behind
 * simple find/save methods, so the rest of the app never sees storage details.
 *
 * Dependency Inversion: LocalAuthProvider depends on this abstraction, not
 * on localStorage. We can swap in memory (tests) or a server API later
 * without changing the provider.
 */
export interface UserRepository {
  findByEmail(email: string): User | undefined;
  save(user: User): void;
}
