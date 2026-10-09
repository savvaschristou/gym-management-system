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
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
