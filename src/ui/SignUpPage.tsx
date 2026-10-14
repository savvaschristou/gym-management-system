import type { SignUpService } from '../services/auth/SignUpService';

/**
 * OWNER: Chinguun
 *
 * WHAT: The sign-up form at /signup.
 * WHY:  Same rules as Login.tsx: this component only handles the inputs and
 *       shows errors. SignUpService (Elif) does the checking and saving.
 *
 * TODO:
 *  - Four inputs with labels: Name, Email, Password, Confirm password
 *    (copy Login.tsx's label/input pattern).
 *  - On submit: const result = await signUpService.signUp({...}).
 *    If result.ok is false, show each error in a <p role="alert">.
 *    If it's true, App re-renders automatically (AuthSession notifies it),
 *    and the routes send the new member to /dashboard.
 *  - A link back: <Link to="/login">Already have an account? Log in</Link>
 */
interface SignUpPageProps {
  signUpService: SignUpService;
}

export default function SignUpPage({ signUpService }: SignUpPageProps) {
  return (
    <div>
      <h1>Create an account</h1>
      <p>TODO: sign-up form</p>
    </div>
  );
}
