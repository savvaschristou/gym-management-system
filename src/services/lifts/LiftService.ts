import type { SessionUser } from '../../domain/auth/User';
import type { Exercise, LiftSet, WorkoutSession } from '../../domain/types';
import { isoDay, newId } from '../../domain/util';

/**
 * Lift logging: a member logs sets (exercise, weight, reps) and sees their
 * history for each exercise.
 *
 * Sets are grouped into one workout session per member per day: the first
 * set of the day starts a session, later sets join it. Set numbers count up
 * per exercise within a session (Bench Press set 1, 2, 3...).
 */

/** The parts of a repository this service needs; LocalStorageRepository fits. */
interface Store<T> {
  findAll(): T[];
  findById(id: string): T | undefined;
  save(record: T): void;
}

export interface SetInput {
  exerciseId: string;
  weightLbs: number;
  reps: number;
}

export type LogResult = { ok: true; set: LiftSet; exercise: Exercise } | { ok: false; errors: string[] };

export interface HistoryRow {
  /** The session's day as 'YYYY-MM-DD' (UTC). */
  date: string;
  setNumber: number;
  weightLbs: number;
  reps: number;
}

export const MAX_WEIGHT_LBS = 2000;
export const MAX_REPS = 100;

export class LiftService {
  constructor(
    private readonly exercises: Store<Exercise>,
    private readonly sessions: Store<WorkoutSession>,
    private readonly sets: Store<LiftSet>
  ) {}

  /** Every exercise, sorted by name, for the exercise picker. */
  listExercises(): Exercise[] {
    return [...this.exercises.findAll()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Validates and saves one set, starting today's session if needed. */
  logSet(user: SessionUser, input: SetInput, now = new Date()): LogResult {
    const exercise = this.exercises.findById(input.exerciseId);
    const errors = [...(exercise ? [] : ['Choose an exercise']), ...validateSetInput(input)];
    if (!exercise || errors.length > 0) return { ok: false, errors };

    const session = this.todaysSession(user.id, now);
    const earlier = this.sets.findAll().filter((s) => s.sessionId === session.id && s.exerciseId === exercise.id);
    const set: LiftSet = {
      id: newId(),
      sessionId: session.id,
      exerciseId: exercise.id,
      setNumber: earlier.length + 1,
      weightLbs: input.weightLbs,
      reps: input.reps,
    };
    this.sets.save(set);
    return { ok: true, set, exercise };
  }

  /** A member's sets for one exercise, newest day first, then by set number. */
  history(user: SessionUser, exerciseId: string): HistoryRow[] {
    const theirSessions = new Map(
      this.sessions
        .findAll()
        .filter((s) => s.userId === user.id)
        .map((s) => [s.id, s])
    );
    return this.sets
      .findAll()
      .flatMap((s) => {
        // Look the session up once; sets from other members' sessions get no match and drop out.
        const session = s.exerciseId === exerciseId ? theirSessions.get(s.sessionId) : undefined;
        return session ? [{ s, startedAt: session.startedAt }] : [];
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || a.s.setNumber - b.s.setNumber)
      .map(({ s, startedAt }) => ({ date: isoDay(startedAt), setNumber: s.setNumber, weightLbs: s.weightLbs, reps: s.reps }));
  }

  private todaysSession(userId: string, now: Date): WorkoutSession {
    const today = isoDay(now);
    const existing = this.sessions.findAll().find((s) => s.userId === userId && isoDay(s.startedAt) === today);
    if (existing) return existing;
    const session: WorkoutSession = { id: newId(), userId, startedAt: now.toISOString() };
    this.sessions.save(session);
    return session;
  }
}

/** Every problem with the weight and reps; an empty array means they are fine. */
export function validateSetInput({ weightLbs, reps }: SetInput): string[] {
  const errors: string[] = [];
  if (!isWithin(weightLbs, 0, MAX_WEIGHT_LBS)) errors.push(`Weight must be between 0 and ${MAX_WEIGHT_LBS} lbs`);
  if (!Number.isInteger(reps) || !isWithin(reps, 1, MAX_REPS)) {
    errors.push(`Reps must be a whole number from 1 to ${MAX_REPS}`);
  }
  return errors;
}

function isWithin(n: number, min: number, max: number): boolean {
  return Number.isFinite(n) && n >= min && n <= max;
}
