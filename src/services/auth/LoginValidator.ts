export interface LoginInput {
  email: string;
  password: string;
}

export class LoginValidator {
  /** Returns every problem found; an empty array means valid. */
  validate({ email, password }: LoginInput): string[] {
    const errors: string[] = [];
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.push('Enter a valid email');
    if (password.length < 6) errors.push('Password must be at least 6 characters');
    return errors;
  }
}
