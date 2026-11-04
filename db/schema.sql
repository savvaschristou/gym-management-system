-- Gym Management System: database schema (PostgreSQL DDL)
--
-- Seven tables in third normal form. Derived values (membership status,
-- personal records, one-rep max) are computed, not stored (ADR-003).
--
-- The same schema is built from scratch by the Sequelize migrations in
-- server/migrations (SQLite for development), and filled with test data by
-- server/seeders. This file is the reference version for PostgreSQL.

CREATE TABLE users (
    user_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    display_name   VARCHAR(100) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(10)  NOT NULL CHECK (role IN ('member', 'staff')),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE membership_plans (
    plan_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(100) NOT NULL UNIQUE,
    duration_days  INTEGER      NOT NULL CHECK (duration_days > 0),
    grace_days     INTEGER      NOT NULL DEFAULT 0 CHECK (grace_days >= 0),
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE memberships (
    membership_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan_id        INTEGER     NOT NULL REFERENCES membership_plans(plan_id),
    start_date     DATE        NOT NULL,
    end_date       DATE        NOT NULL,
    state          VARCHAR(10) NOT NULL DEFAULT 'active'
                   CHECK (state IN ('active', 'frozen', 'cancelled')),
    CHECK (end_date >= start_date)
);

CREATE TABLE check_ins (
    check_in_id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    member_id      INTEGER   NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    staff_id       INTEGER   NOT NULL REFERENCES users(user_id),
    checked_in_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercises (
    exercise_id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(100) NOT NULL UNIQUE,
    muscle_group   VARCHAR(50)  NOT NULL
);

CREATE TABLE workout_sessions (
    session_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        INTEGER   NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    started_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes          TEXT
);

CREATE TABLE lift_sets (
    set_id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id     INTEGER      NOT NULL REFERENCES workout_sessions(session_id) ON DELETE CASCADE,
    exercise_id    INTEGER      NOT NULL REFERENCES exercises(exercise_id),
    set_number     INTEGER      NOT NULL CHECK (set_number > 0),
    weight_lbs     NUMERIC(6,2) NOT NULL CHECK (weight_lbs >= 0),
    reps           INTEGER      NOT NULL CHECK (reps > 0),
    UNIQUE (session_id, exercise_id, set_number)
);

-- Indexes for the lookups the app makes most. Primary keys and UNIQUE
-- columns are indexed automatically; lift_sets(session_id) is covered by
-- the leading column of its UNIQUE constraint.
CREATE INDEX idx_memberships_user   ON memberships(user_id);
CREATE INDEX idx_memberships_plan   ON memberships(plan_id);
CREATE INDEX idx_checkins_member    ON check_ins(member_id, checked_in_at);
CREATE INDEX idx_checkins_staff     ON check_ins(staff_id);
CREATE INDEX idx_sessions_user      ON workout_sessions(user_id, started_at);
CREATE INDEX idx_liftsets_exercise  ON lift_sets(exercise_id);
