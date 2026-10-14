/**
 * OWNER: Sawyer
 *
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

  /** TODO: read this.key and JSON.parse it. Return [] if nothing is stored. */
  findAll(): T[] {
    throw new Error('TODO: findAll');
  }

  /** TODO: findAll(), then find the record with this id (or undefined). */
  findById(id: string): T | undefined {
    throw new Error('TODO: findById');
  }

  /**
   * TODO: findAll(), drop any record with the same id, add this one,
   * then setItem(this.key, JSON.stringify(list)).
   */
  save(record: T): void {
    throw new Error('TODO: save');
  }

  /** TODO: findAll(), filter out this id, write the list back. */
  delete(id: string): void {
    throw new Error('TODO: delete');
  }
}
