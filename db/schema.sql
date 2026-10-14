-- OWNER: Sawyer
-- Gym Management System: reference schema and demo data (PostgreSQL)
--
-- The prototype stores these same tables as JSON in localStorage (ADR-002).
-- This file is the target schema if the team moves to a real database in
-- the week of Nov 30, and the DDL deliverable for the architecture milestone.
-- All tables are in 3NF; derived values (membership status, PRs, 1RM) are
-- computed, not stored (ADR-003).

CREATE TABLE users (
    user_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    password_salt  VARCHAR(64)  NOT NULL,
    role           VARCHAR(10)  NOT NULL CHECK (role IN ('member', 'staff')),
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
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
    user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan_id        INTEGER NOT NULL REFERENCES membership_plans(plan_id),
    start_date     DATE    NOT NULL,
    end_date       DATE    NOT NULL,
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

-- Indexes for the lookups the app makes most
CREATE INDEX idx_memberships_user   ON memberships(user_id);
CREATE INDEX idx_checkins_member    ON check_ins(member_id, checked_in_at);
CREATE INDEX idx_sessions_user      ON workout_sessions(user_id, started_at);
CREATE INDEX idx_liftsets_exercise  ON lift_sets(exercise_id);

-- ---------------------------------------------------------------
-- Demo data
-- ---------------------------------------------------------------
-- Demo data. The app creates the same demo accounts in localStorage on startup.
-- Plan lengths and grace days are placeholders; settle real values in the
-- week of Oct 19. Password hashes are placeholders the app regenerates.

INSERT INTO membership_plans (name, duration_days, grace_days, description) VALUES
    ('Monthly',   30,  5, 'Month-to-month access'),
    ('Semester', 120,  7, 'One academic semester'),
    ('Annual',   365, 14, 'Twelve months of access');

INSERT INTO exercises (name, muscle_group) VALUES
    ('Back Squat', 'Legs'),
    ('Bench Press', 'Chest'),
    ('Deadlift', 'Back'),
    ('Overhead Press', 'Shoulders'),
    ('Barbell Row', 'Back');

INSERT INTO users (email, password_hash, password_salt, role, first_name, last_name) VALUES
    ('staff@demo.gym',  'hash', 'salt', 'staff',  'Demo', 'Staff'),
    ('member@demo.gym', 'hash', 'salt', 'member', 'Demo', 'Member');
