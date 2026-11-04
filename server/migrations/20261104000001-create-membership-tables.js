'use strict';

/**
 * Migration 1: users, membership plans, memberships and check-ins.
 *
 * The same tables as db/schema.sql, written for SQLite: identity columns
 * become INTEGER PRIMARY KEY AUTOINCREMENT and BOOLEAN becomes 0/1. The SQL is
 * written out (rather than built with createTable) so every CHECK constraint,
 * foreign key and index matches the documented schema exactly.
 */
const UP = [
  `CREATE TABLE users (
     user_id        INTEGER PRIMARY KEY AUTOINCREMENT,
     email          VARCHAR(255) NOT NULL UNIQUE,
     display_name   VARCHAR(100) NOT NULL,
     password_hash  VARCHAR(255) NOT NULL,
     role           VARCHAR(10)  NOT NULL CHECK (role IN ('member', 'staff')),
     created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE TABLE membership_plans (
     plan_id        INTEGER PRIMARY KEY AUTOINCREMENT,
     name           VARCHAR(100) NOT NULL UNIQUE,
     duration_days  INTEGER      NOT NULL CHECK (duration_days > 0),
     grace_days     INTEGER      NOT NULL DEFAULT 0 CHECK (grace_days >= 0),
     description    TEXT,
     is_active      INTEGER      NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
   )`,
  `CREATE TABLE memberships (
     membership_id  INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id        INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
     plan_id        INTEGER     NOT NULL REFERENCES membership_plans(plan_id),
     start_date     DATE        NOT NULL,
     end_date       DATE        NOT NULL,
     state          VARCHAR(10) NOT NULL DEFAULT 'active'
                    CHECK (state IN ('active', 'frozen', 'cancelled')),
     CHECK (end_date >= start_date)
   )`,
  `CREATE TABLE check_ins (
     check_in_id    INTEGER PRIMARY KEY AUTOINCREMENT,
     member_id      INTEGER   NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
     staff_id       INTEGER   NOT NULL REFERENCES users(user_id),
     checked_in_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE INDEX idx_memberships_user ON memberships(user_id)`,
  `CREATE INDEX idx_memberships_plan ON memberships(plan_id)`,
  `CREATE INDEX idx_checkins_member  ON check_ins(member_id, checked_in_at)`,
  `CREATE INDEX idx_checkins_staff   ON check_ins(staff_id)`,
];

const DOWN = ['check_ins', 'memberships', 'membership_plans', 'users'].map((t) => `DROP TABLE IF EXISTS ${t}`);

module.exports = {
  async up(queryInterface) {
    // SQLite runs one statement per call, so each is sent separately.
    for (const sql of UP) await queryInterface.sequelize.query(sql);
  },
  async down(queryInterface) {
    for (const sql of DOWN) await queryInterface.sequelize.query(sql);
  },
};
