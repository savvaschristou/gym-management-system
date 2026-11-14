export interface LoginInput {
  email: string;
  password: string;
}

/** Only rules out obvious typos; the real policy for new passwords is SignUpService's MIN_PASSWORD_LENGTH. */
export const MIN_LOGIN_PASSWORD_LENGTH = 6;

export class LoginValidator {
  /** Returns every problem found; an empty array means valid. */
  validate({ email, password }: LoginInput): string[] {
    const errors: string[] = [];
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.push('Enter a valid email');
    if (password.length < MIN_LOGIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_LOGIN_PASSWORD_LENGTH} characters`);
    }
    return errors;
  }
}
