/**
 * WHAT: One reusable class that saves any kind of record as a JSON array
 *       under one localStorage key. Use it directly for any table:
 *         const exercises = new LocalStorageRepository<Exercise>('gym.exercises');
 * WHY:  The general version of what LocalStorageUserRepository does for
 *       users. Later features (plans, check-ins, lifts) use this instead of
 *       each writing their own storage code. It's the Repository pattern
 *       from our design doc.
 *
 * The `store` parameter works like LocalStorageUserRepository's: tests can
 * pass a fake object instead of the real localStorage.
 */
export class LocalStorageRepository<T extends { id: string }> {
  constructor(
    private readonly key: string,
    private readonly store: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage
  ) {}

  /** Every record, or [] if nothing is stored yet or the data is unreadable. */
  findAll(): T[] {
    const raw = this.store.getItem(this.key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  findById(id: string): T | undefined {
    return this.findAll().find((r) => r.id === id);
  }

  /** Inserts, or replaces the record that has the same id. */
  save(record: T): void {
    const others = this.findAll().filter((r) => r.id !== record.id);
    this.write([...others, record]);
  }

  /** No error if the id doesn't exist. */
  delete(id: string): void {
    this.write(this.findAll().filter((r) => r.id !== id));
  }

  private write(records: T[]): void {
    this.store.setItem(this.key, JSON.stringify(records));
  }
}
