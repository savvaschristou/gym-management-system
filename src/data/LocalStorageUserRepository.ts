import type { User } from '../domain/auth/User';
import type { UserRepository } from './UserRepository';

export class LocalStorageUserRepository implements UserRepository {
  constructor(
    private readonly store: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage,
    private readonly key: string = 'users'
  ) {}

  findByEmail(email: string): User | undefined {
    const wanted = email.toLowerCase();
    return this.all().find((u) => u.email.toLowerCase() === wanted);
  }

  save(user: User): void {
    const others = this.all().filter((u) => u.id !== user.id);
    others.push(user);
    this.store.setItem(this.key, JSON.stringify(others));
  }

  private all(): User[] {
    const raw = this.store.getItem(this.key);
    return raw ? (JSON.parse(raw) as User[]) : [];
  }
}
