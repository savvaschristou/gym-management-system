import type { Member } from '../domain/members/Member';

export interface WelcomeNotifier {
  sendWelcome(member: Member): void;
}

export class ConsoleWelcomeNotifier implements WelcomeNotifier {
  sendWelcome(member: Member): void {
    console.log(`Welcome ${member.firstName}! Your ${member.planId} plan starts ${member.startDate}.`);
  }
}
