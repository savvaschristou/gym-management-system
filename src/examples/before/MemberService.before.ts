/**
 * BEFORE: a deliberately flawed first draft of member registration.
 *
 *  [S] Single Responsibility: one class validates, calculates plan terms,
 *      persists, sends the welcome message, and formats display text.
 *  [O] Open/Closed: plans live in switch statements, so a new plan means
 *      editing registerMember AND isActive.
 *  [D] Dependency Inversion: the class talks directly to localStorage and
 *      console, so it can't be tested or swapped out.
 *
 * Nothing in the app imports this file. See src/services/MemberService.ts.
 */

export class MemberService {
  registerMember(
    firstName: string,
    lastName: string,
    email: string,
    planType: string
  ): string {
    // [S] validation mixed into the registration method
    if (!firstName.trim()) throw new Error('First name is required');
    if (!lastName.trim()) throw new Error('Last name is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email is not valid');

    // [O] adding a plan means editing this switch
    let months: number;
    let guestPasses: number;
    switch (planType) {
      case 'monthly':
        months = 1;
        guestPasses = 0;
        break;
      case 'annual':
        months = 12;
        guestPasses = 2;
        break;
      case 'student':
        months = 4;
        guestPasses = 0;
        break;
      default:
        throw new Error('Choose a membership plan');
    }

    const member = {
      id: String(Date.now()),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      planType,
      months,
      guestPasses,
      startDate: new Date().toISOString().slice(0, 10),
    };

    // [D] hard-wired to localStorage
    const existing = JSON.parse(localStorage.getItem('members') || '[]');
    existing.push(member);
    localStorage.setItem('members', JSON.stringify(existing));

    // [D] hard-wired to console as the "email" channel
    console.log(`Welcome ${member.firstName}! Your ${planType} plan is active.`);

    // [S] presentation logic inside the service
    return `${member.lastName}, ${member.firstName} (${planType}) - ${months} month(s)`;
  }

  isActive(id: string): boolean {
    // [D] reads localStorage again
    const members = JSON.parse(localStorage.getItem('members') || '[]');
    const m = members.find((x: { id: string }) => x.id === id);
    if (!m) return false;

    // [O] a second switch that must stay in sync with the first
    let graceDays: number;
    switch (m.planType) {
      case 'monthly':
        graceDays = 3;
        break;
      case 'annual':
        graceDays = 7;
        break;
      default:
        graceDays = 0;
    }

    const end = new Date(m.startDate);
    end.setMonth(end.getMonth() + m.months);
    end.setDate(end.getDate() + graceDays);
    return new Date() <= end;
  }
}
