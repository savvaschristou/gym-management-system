import type { Member } from '../domain/members/Member';

/**
 * REPOSITORY PATTERN / Dependency Inversion: MemberService depends on this
 * abstraction, not on localStorage. Storage details live in the
 * implementations, so we can swap in memory, a server API, or a database
 * without touching the service, and tests can use a fake.
 */
export interface MemberRepository {
  save(member: Member): void;
  findById(id: string): Member | undefined;
  findAll(): Member[];
}
