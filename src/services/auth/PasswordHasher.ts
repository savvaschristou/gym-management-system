const HEX = 16;
const HEX_CHARS_PER_BYTE = 2;

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

/**
 * SHA-256 via crypto.subtle, returned as hex.
 *
 * Note: hashing in the browser is not real security (the hash itself
 * becomes the password). The backend will handle this properly later.
 */
export class Sha256PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(HEX).padStart(HEX_CHARS_PER_BYTE, '0'))
      .join('');
  }
}

/**
 * Compares two strings in time that depends only on their length, not on
 * where they first differ, so response timing can't reveal how much of a
 * guessed hash was right. Hashes are a fixed length, so the early length
 * check gives nothing away.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}
