import { useState } from 'react';
import type { SessionUser } from '../domain/auth/User';
import type { StaffService } from '../services/staff/StaffService';
import { STATUS_LABEL } from './MembershipCard';

/**
 * The staff home page tools: search members, check them in, and assign a
 * plan. All rules live in StaffService; this component only shows results
 * and messages.
 */
interface StaffToolsProps {
  service: StaffService;
  staff: SessionUser;
  /** Today's date as 'YYYY-MM-DD'. Passed in so tests can pick the day. */
  today: string;
}

export default function StaffTools({ service, staff, today }: StaffToolsProps) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [planChoice, setPlanChoice] = useState<Record<string, string>>({});
  const [, setVersion] = useState(0); // bumped after a change so the list re-reads storage

  const plans = service.activePlans(staff);
  const results = service.searchMembers(staff, query, today);

  function checkIn(memberId: string, name: string) {
    const result = service.checkIn(staff, memberId, today);
    setMessage(result.ok ? `${name} checked in (${STATUS_LABEL[result.status]})` : `${name} can't check in: ${result.reason}`);
  }

  function assign(memberId: string, name: string) {
    const planId = planChoice[memberId] ?? plans[0]?.id;
    try {
      const membership = service.assignPlan(staff, memberId, planId, today);
      setMessage(`${name} is now on the ${plans.find((p) => p.id === planId)?.name} plan until ${membership.endDate}`);
      setVersion((v) => v + 1);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <section>
      <h2>Members</h2>
      <label htmlFor="member-search">Search members</label>{' '}
      <input id="member-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" />
      {message && <p role="status">{message}</p>}
      {results.length === 0 ? (
        <p>No members found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Membership</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ member, plan, membership, status }) => (
              <tr key={member.id}>
                <td>{member.displayName}</td>
                <td>{member.email}</td>
                <td>{status ? `${plan?.name}, ${STATUS_LABEL[status]} (ends ${membership?.endDate})` : 'None'}</td>
                <td>
                  <button aria-label={`Check in ${member.displayName}`} onClick={() => checkIn(member.id, member.displayName)}>
                    Check in
                  </button>{' '}
                  <select
                    aria-label={`Plan for ${member.displayName}`}
                    value={planChoice[member.id] ?? plans[0]?.id}
                    onChange={(e) => setPlanChoice({ ...planChoice, [member.id]: e.target.value })}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>{' '}
                  <button aria-label={`Assign plan to ${member.displayName}`} onClick={() => assign(member.id, member.displayName)}>
                    Assign plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
