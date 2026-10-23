/**
 * Test helper: an in-memory stand-in for localStorage, so tests never touch
 * the real browser storage and never leak data into each other.
 */
export function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    /** For assertions: the raw stored string, or undefined. */
    raw: (key: string) => data.get(key),
  };
}

/** A fake hasher; Jest has no crypto.subtle, so the real one can't run here. */
export const fakeHasher = { hash: async (password: string) => 'hashed:' + password };
