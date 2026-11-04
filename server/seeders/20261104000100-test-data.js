'use strict';

/**
 * Test data for every table.
 *
 *   users             25  (2 demo accounts, 3 more staff, 20 more members)
 *   membership_plans   4  (a small lookup table, like a real gym's price list)
 *   exercises         20
 *   memberships       26  (every status: active, grace period, expired, frozen, cancelled)
 *   check_ins         60
 *   workout_sessions  40
 *   lift_sets       ~300
 *
 * Every user's password is demo123, hashed with SHA-256 exactly as the app's
 * Sha256PasswordHasher does. Dates are relative to the day the seed runs, so
 * statuses stay meaningful; the "random" choices come from a fixed seed, so
 * every run produces the same data.
 */
const crypto = require('crypto');

// Small deterministic random number generator (mulberry32).
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(42);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

const DAY = 24 * 60 * 60 * 1000;
const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const date = (offsetDays) => {
  const d = new Date(today.getTime() + offsetDays * DAY);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const timestamp = (offsetDays, hour, minute) => `${date(offsetDays)} ${pad(hour)}:${pad(minute)}:00`;

const PASSWORD_HASH = crypto.createHash('sha256').update('demo123').digest('hex');

const STAFF = [
  ['staff@demo.gym', 'Demo Staff'],
  ['jordan.reyes@example.com', 'Jordan Reyes'],
  ['priya.shah@example.com', 'Priya Shah'],
  ['marcus.bell@example.com', 'Marcus Bell'],
];
const MEMBER_NAMES = [
  'Ava Thompson', 'Liam Carter', 'Sofia Nguyen', 'Noah Brooks', 'Emma Rivera',
  'Ethan Ward', 'Mia Coleman', 'Lucas Patel', 'Harper Lee', 'Mason Diaz',
  'Ella Foster', 'Logan Price', 'Grace Kim', 'Owen Hughes', 'Chloe Ramirez',
  'Caleb Turner', 'Lily Sanders', 'Isaac Morgan', 'Zoe Bennett', 'Wyatt Hayes',
];
const MEMBERS = [
  ['member@demo.gym', 'Demo Member'],
  ...MEMBER_NAMES.map((n) => [`${n.toLowerCase().replace(' ', '.')}@example.com`, n]),
];

const PLANS = [
  { plan_id: 1, name: 'Monthly', duration_days: 30, grace_days: 5, description: 'Month-to-month access', is_active: 1 },
  { plan_id: 2, name: 'Semester', duration_days: 120, grace_days: 7, description: 'One academic semester', is_active: 1 },
  { plan_id: 3, name: 'Annual', duration_days: 365, grace_days: 14, description: 'Twelve months of access', is_active: 1 },
  { plan_id: 4, name: 'Summer Pass', duration_days: 90, grace_days: 3, description: 'June through August; no longer sold', is_active: 0 },
];

// [name, muscle group, typical working weight in lbs]
const EXERCISES = [
  ['Back Squat', 'Legs', 185], ['Front Squat', 'Legs', 135], ['Leg Press', 'Legs', 270],
  ['Walking Lunge', 'Legs', 50], ['Calf Raise', 'Legs', 135], ['Deadlift', 'Back', 225],
  ['Romanian Deadlift', 'Hamstrings', 155], ['Hip Thrust', 'Glutes', 185], ['Barbell Row', 'Back', 135],
  ['Pull-Up', 'Back', 0], ['Lat Pulldown', 'Back', 120], ['Bench Press', 'Chest', 155],
  ['Incline Bench Press', 'Chest', 125], ['Dip', 'Chest', 0], ['Cable Fly', 'Chest', 30],
  ['Overhead Press', 'Shoulders', 95], ['Push Press', 'Shoulders', 115], ['Face Pull', 'Shoulders', 40],
  ['Dumbbell Curl', 'Arms', 30], ['Tricep Pushdown', 'Arms', 50],
];

function build() {
  const users = [];
  STAFF.forEach(([email, name], i) =>
    users.push({ user_id: i + 1, email, display_name: name, password_hash: PASSWORD_HASH, role: 'staff', created_at: timestamp(-200 + i, 9, 0) })
  );
  MEMBERS.forEach(([email, name], i) =>
    users.push({ user_id: STAFF.length + i + 1, email, display_name: name, password_hash: PASSWORD_HASH, role: 'member', created_at: timestamp(-180 + i * 7, 10, 30) })
  );
  const staffIds = users.filter((u) => u.role === 'staff').map((u) => u.user_id);
  const memberIds = users.filter((u) => u.role === 'member').map((u) => u.user_id);

  // One current membership per member, spread across every status.
  const memberships = [];
  const canTrain = []; // members whose membership lets them in today (active or grace)
  memberIds.forEach((userId, i) => {
    const plan = PLANS[i % 3]; // only plans still sold
    let start;
    let end;
    let state = 'active';
    if (i === 0) {
      [start, end] = [0, 30]; // the demo member: Monthly, starts today (matches the app)
    } else if (i <= 3) {
      [start, end] = [-32, -2]; // ended 2 days ago: in the grace period
    } else if (i <= 6) {
      [start, end] = [-60, -30]; // ended a month ago: expired
    } else if (i <= 8) {
      [start, end] = [-20, -20 + plan.duration_days];
      state = 'frozen';
    } else if (i === 9) {
      [start, end] = [-40, -40 + plan.duration_days];
      state = 'cancelled';
    } else {
      start = -between(1, 25);
      end = start + plan.duration_days;
    }
    const planId = i === 0 ? 1 : i <= 6 ? 1 : plan.plan_id;
    memberships.push({ user_id: userId, plan_id: planId, start_date: date(start), end_date: date(end), state });
    if (state === 'active' && end >= -5) canTrain.push(userId);
  });
  // Five members also have an older, finished membership (history).
  memberIds.slice(10, 15).forEach((userId) =>
    memberships.push({ user_id: userId, plan_id: 4, start_date: date(-150), end_date: date(-60), state: 'active' })
  );
  memberships.forEach((m, i) => (m.membership_id = i + 1));

  const checkIns = [];
  for (let i = 0; i < 60; i++) {
    checkIns.push({
      check_in_id: i + 1,
      member_id: pick(canTrain),
      staff_id: pick(staffIds),
      checked_in_at: timestamp(-between(0, 29), between(6, 20), between(0, 59)),
    });
  }

  const exercises = EXERCISES.map(([name, group], i) => ({ exercise_id: i + 1, name, muscle_group: group }));
  const strength = Object.fromEntries(memberIds.map((id) => [id, 0.6 + rand() * 0.7])); // each member's strength

  const sessions = [];
  const sets = [];
  for (let s = 1; s <= 40; s++) {
    const userId = pick(canTrain);
    sessions.push({
      session_id: s,
      user_id: userId,
      started_at: timestamp(-between(0, 29), between(6, 20), pick([0, 15, 30, 45])),
      notes: pick([null, null, 'Felt strong today', 'Short on time', 'Deload week', 'New gym shoes']),
    });
    const chosen = new Set();
    const count = between(2, 3);
    while (chosen.size < count) chosen.add(between(0, EXERCISES.length - 1));
    for (const e of chosen) {
      const base = EXERCISES[e][2];
      for (let n = 1; n <= 3; n++) {
        sets.push({
          set_id: sets.length + 1,
          session_id: s,
          exercise_id: e + 1,
          set_number: n,
          weight_lbs: Math.round((base * strength[userId]) / 5) * 5,
          reps: between(5, 10),
        });
      }
    }
  }

  return { users, plans: PLANS, exercises, memberships, checkIns, sessions, sets };
}

module.exports = {
  async up(queryInterface) {
    const d = build();
    await queryInterface.bulkInsert('users', d.users);
    await queryInterface.bulkInsert('membership_plans', d.plans);
    await queryInterface.bulkInsert('memberships', d.memberships);
    await queryInterface.bulkInsert('check_ins', d.checkIns);
    await queryInterface.bulkInsert('exercises', d.exercises);
    await queryInterface.bulkInsert('workout_sessions', d.sessions);
    await queryInterface.bulkInsert('lift_sets', d.sets);
  },
  async down(queryInterface) {
    for (const table of ['lift_sets', 'workout_sessions', 'exercises', 'check_ins', 'memberships', 'membership_plans', 'users']) {
      await queryInterface.bulkDelete(table, null, {});
    }
  },
};
