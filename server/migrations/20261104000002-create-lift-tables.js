'use strict';

/**
 * Migration 2: exercises, workout sessions and lift sets.
 *
 * Lift tracking gets its own migration because it was its own feature: a
 * database built before this migration simply has no lift tables yet.
 * Same SQL as db/schema.sql, written for SQLite.
 */
const UP = [
  `CREATE TABLE exercises (
     exercise_id    INTEGER PRIMARY KEY AUTOINCREMENT,
     name           VARCHAR(100) NOT NULL UNIQUE,
     muscle_group   VARCHAR(50)  NOT NULL
   )`,
  `CREATE TABLE workout_sessions (
     session_id     INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id        INTEGER   NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
     started_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     notes          TEXT
   )`,
  `CREATE TABLE lift_sets (
     set_id         INTEGER PRIMARY KEY AUTOINCREMENT,
     session_id     INTEGER      NOT NULL REFERENCES workout_sessions(session_id) ON DELETE CASCADE,
     exercise_id    INTEGER      NOT NULL REFERENCES exercises(exercise_id),
     set_number     INTEGER      NOT NULL CHECK (set_number > 0),
     weight_lbs     NUMERIC(6,2) NOT NULL CHECK (weight_lbs >= 0),
     reps           INTEGER      NOT NULL CHECK (reps > 0),
     UNIQUE (session_id, exercise_id, set_number)
   )`,
  `CREATE INDEX idx_sessions_user     ON workout_sessions(user_id, started_at)`,
  `CREATE INDEX idx_liftsets_exercise ON lift_sets(exercise_id)`,
];

const DOWN = ['lift_sets', 'workout_sessions', 'exercises'].map((t) => `DROP TABLE IF EXISTS ${t}`);

module.exports = {
  async up(queryInterface) {
    for (const sql of UP) await queryInterface.sequelize.query(sql);
  },
  async down(queryInterface) {
    for (const sql of DOWN) await queryInterface.sequelize.query(sql);
  },
};
