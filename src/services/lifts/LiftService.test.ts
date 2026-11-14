import { LocalStorageRepository } from '../../data/LocalStorageRepository';
import type { SessionUser } from '../../domain/auth/User';
import type { Exercise, LiftSet, WorkoutSession } from '../../domain/types';
import { fakeStorage } from '../../testUtils';
import { LiftService } from './LiftService';

const ava: SessionUser = { id: 'ava', email: 'ava@example.com', displayName: 'Ava Thompson', role: 'member' };
const liam: SessionUser = { id: 'liam', email: 'liam@example.com', displayName: 'Liam Carter', role: 'member' };
const MONDAY = new Date('2026-11-09T17:00:00Z');
const MONDAY_LATER = new Date('2026-11-09T18:30:00Z');
const FRIDAY = new Date('2026-11-13T17:00:00Z');

function setup() {
  const storage = fakeStorage();
  const exercises = new LocalStorageRepository<Exercise>('exercises', storage);
  const sessions = new LocalStorageRepository<WorkoutSession>('sessions', storage);
  const sets = new LocalStorageRepository<LiftSet>('sets', storage);
  exercises.save({ id: 'squat', name: 'Back Squat', muscleGroup: 'Legs' });
  exercises.save({ id: 'bench', name: 'Bench Press', muscleGroup: 'Chest' });
  exercises.save({ id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' });
  return { service: new LiftService(exercises, sessions, sets), sessions, sets };
}

describe('LiftService', () => {
  it('lists exercises sorted by name', () => {
    expect(setup().service.listExercises().map((e) => e.name)).toEqual(['Back Squat', 'Bench Press', 'Deadlift']);
  });

  it('logs a set and starts a workout session for the day', () => {
    const { service, sessions } = setup();
    const result = service.logSet(ava, { exerciseId: 'bench', weightLbs: 135, reps: 8 }, MONDAY);
    expect(result).toMatchObject({ ok: true, set: { exerciseId: 'bench', setNumber: 1, weightLbs: 135, reps: 8 } });
    expect(sessions.findAll()).toEqual([expect.objectContaining({ userId: 'ava', startedAt: MONDAY.toISOString() })]);
  });

  it('puts later sets the same day into the same session and numbers them per exercise', () => {
    const { service, sessions } = setup();
    service.logSet(ava, { exerciseId: 'bench', weightLbs: 135, reps: 8 }, MONDAY);
    service.logSet(ava, { exerciseId: 'squat', weightLbs: 185, reps: 5 }, MONDAY);
    const third = service.logSet(ava, { exerciseId: 'bench', weightLbs: 145, reps: 6 }, MONDAY_LATER);
    expect(third).toMatchObject({ ok: true, set: { setNumber: 2 } });
    expect(sessions.findAll()).toHaveLength(1);
  });

  it('starts a new session on a new day, with set numbers starting again at 1', () => {
    const { service, sessions } = setup();
    service.logSet(ava, { exerciseId: 'bench', weightLbs: 135, reps: 8 }, MONDAY);
    const friday = service.logSet(ava, { exerciseId: 'bench', weightLbs: 140, reps: 8 }, FRIDAY);
    expect(friday).toMatchObject({ ok: true, set: { setNumber: 1 } });
    expect(sessions.findAll()).toHaveLength(2);
  });

  it('accepts the boundary values: 0 lbs (bodyweight) and 1 rep', () => {
    const { service } = setup();
    expect(service.logSet(ava, { exerciseId: 'squat', weightLbs: 0, reps: 1 }, MONDAY).ok).toBe(true);
  });

  it('rejects negative weight, fractional or zero reps, and an unknown exercise, saving nothing', () => {
    const { service, sets } = setup();
    expect(service.logSet(ava, { exerciseId: 'bench', weightLbs: -5, reps: 0 }, MONDAY)).toEqual({
      ok: false,
      errors: ['Weight must be between 0 and 2000 lbs', 'Reps must be a whole number from 1 to 100'],
    });
    expect(service.logSet(ava, { exerciseId: 'bench', weightLbs: 100, reps: 2.5 }, MONDAY).ok).toBe(false);
    expect(service.logSet(ava, { exerciseId: 'curl', weightLbs: 30, reps: 10 }, MONDAY)).toEqual({
      ok: false,
      errors: ['Choose an exercise'],
    });
    expect(sets.findAll()).toEqual([]);
  });

  it('shows history for one exercise, newest day first, sets in order within a day', () => {
    const { service } = setup();
    service.logSet(ava, { exerciseId: 'bench', weightLbs: 135, reps: 8 }, MONDAY);
    service.logSet(ava, { exerciseId: 'bench', weightLbs: 145, reps: 6 }, MONDAY_LATER);
    service.logSet(ava, { exerciseId: 'squat', weightLbs: 185, reps: 5 }, MONDAY);
    service.logSet(ava, { exerciseId: 'bench', weightLbs: 140, reps: 8 }, FRIDAY);
    expect(service.history(ava, 'bench')).toEqual([
      { date: '2026-11-13', setNumber: 1, weightLbs: 140, reps: 8 },
      { date: '2026-11-09', setNumber: 1, weightLbs: 135, reps: 8 },
      { date: '2026-11-09', setNumber: 2, weightLbs: 145, reps: 6 },
    ]);
  });

  it('never shows one member another member\'s sets', () => {
    const { service } = setup();
    service.logSet(ava, { exerciseId: 'bench', weightLbs: 135, reps: 8 }, MONDAY);
    service.logSet(liam, { exerciseId: 'bench', weightLbs: 225, reps: 5 }, MONDAY);
    expect(service.history(liam, 'bench')).toEqual([{ date: '2026-11-09', setNumber: 1, weightLbs: 225, reps: 5 }]);
    expect(service.history(ava, 'deadlift')).toEqual([]);
  });
});
