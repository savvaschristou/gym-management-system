import type { Member } from '../domain/members/Member';
import type { MemberRepository } from './MemberRepository';

/** Map-based repository, handy for tests. */
export class InMemoryMemberRepository implements MemberRepository {
  private readonly members = new Map<string, Member>();

  save(member: Member): void {
    this.members.set(member.id, member);
  }

  findById(id: string): Member | undefined {
    return this.members.get(id);
  }

  findAll(): Member[] {
    return Array.from(this.members.values());
  }
}
