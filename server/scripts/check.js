'use strict';

/**
 * Proves the database works through the ORM: counts every table, follows the
 * relationships, and confirms foreign keys and validations reject bad data.
 * Run after `npm run db:reset` with `npm run db:check`. Exits with an error
 * code if anything is wrong, so CI fails loudly.
 */
const { sequelize, User, MembershipPlan, Membership, CheckIn, Exercise, WorkoutSession, LiftSet } = require('../models');

const MINIMUM = { users: 20, memberships: 20, check_ins: 20, exercises: 20, workout_sessions: 20, lift_sets: 20 };

async function main() {
  let failed = false;
  const fail = (msg) => {
    console.log(`FAIL  ${msg}`);
    failed = true;
  };

  console.log('Rows per table');
  const models = { users: User, membership_plans: MembershipPlan, memberships: Membership, check_ins: CheckIn, exercises: Exercise, workout_sessions: WorkoutSession, lift_sets: LiftSet };
  for (const [table, model] of Object.entries(models)) {
    const n = await model.count();
    console.log(`  ${table.padEnd(18)} ${n}`);
    if (MINIMUM[table] && n < MINIMUM[table]) fail(`${table} has fewer than ${MINIMUM[table]} rows`);
  }

  console.log('\nFollowing relationships through the ORM');
  const demo = await User.findOne({ where: { email: 'member@demo.gym' }, include: { model: Membership, include: MembershipPlan } });
  const m = demo.Memberships[0];
  console.log(`  ${demo.displayName}: ${m.MembershipPlan.name} membership, ${m.state}, ${m.startDate} to ${m.endDate}`);

  const session = await WorkoutSession.findOne({
    include: [User, { model: LiftSet, as: 'sets', include: Exercise }],
    order: [['startedAt', 'DESC']],
  });
  const first = session.sets[0];
  console.log(`  Latest session: ${session.User.displayName}, ${session.sets.length} sets, e.g. ${first.Exercise.name} ${first.weightLbs} lbs x ${first.reps}`);

  const visit = await CheckIn.findOne({ include: [{ model: User, as: 'member' }, { model: User, as: 'staff' }] });
  console.log(`  A check-in: ${visit.member.displayName} let in by ${visit.staff.displayName}`);

  console.log('\nRejecting bad data');
  const expectRejected = async (label, fn) => {
    try {
      await fn();
      fail(`${label} was accepted`);
    } catch (e) {
      console.log(`  rejected: ${label}`);
    }
  };
  await expectRejected('a role that is not member or staff (ORM validation)', () =>
    User.create({ email: 'x@example.com', displayName: 'X', passwordHash: 'h', role: 'admin' })
  );
  await expectRejected('a membership ending before it starts (ORM validation)', () =>
    Membership.create({ userId: demo.userId, planId: 1, startDate: '2026-12-01', endDate: '2026-11-01' })
  );
  await expectRejected('a membership for a user that does not exist (foreign key)', () =>
    sequelize.query(`INSERT INTO memberships (user_id, plan_id, start_date, end_date) VALUES (9999, 1, '2026-11-01', '2026-12-01')`)
  );
  await expectRejected('a lift set with 0 reps (CHECK constraint)', () =>
    sequelize.query(`INSERT INTO lift_sets (session_id, exercise_id, set_number, weight_lbs, reps) VALUES (1, 1, 99, 100, 0)`)
  );

  const [problems] = await sequelize.query('PRAGMA foreign_key_check');
  if (problems.length) fail(`${problems.length} rows break a foreign key`);
  else console.log('  foreign_key_check: every row points at a real parent');

  await sequelize.close();
  console.log(failed ? '\nCHECK FAILED' : '\nAll checks passed');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
