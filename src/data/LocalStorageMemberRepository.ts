import type { Member } from '../domain/members/Member';
import type { MemberRepository } from './MemberRepository';

export class LocalStorageMemberRepository implements MemberRepository {
  constructor(
    private readonly store: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage,
    private readonly key: string = 'members'
  ) {}

  save(member: Member): void {
    const others = this.findAll().filter((m) => m.id !== member.id);
    others.push(member);
    this.store.setItem(this.key, JSON.stringify(others));
  }

  findById(id: string): Member | undefined {
    return this.findAll().find((m) => m.id === id);
  }

  findAll(): Member[] {
    const raw = this.store.getItem(this.key);
    return raw ? (JSON.parse(raw) as Member[]) : [];
  }
}
