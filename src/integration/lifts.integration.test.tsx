/**
 * INTEGRATION TESTS: the LiftLog screen wired to the real LiftService and
 * real localStorage repositories (over fakeStorage).
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalStorageRepository } from '../data/LocalStorageRepository';
import type { SessionUser } from '../domain/auth/User';
import type { Exercise, LiftSet, WorkoutSession } from '../domain/types';
import { LiftService } from '../services/lifts/LiftService';
import { fakeStorage } from '../testUtils';
import LiftLog from '../ui/LiftLog';

const ava: SessionUser = { id: 'ava', email: 'ava@example.com', displayName: 'Ava Thompson', role: 'member' };

function renderLiftLog() {
  const storage = fakeStorage();
  const exercises = new LocalStorageRepository<Exercise>('exercises', storage);
  const sessions = new LocalStorageRepository<WorkoutSession>('sessions', storage);
  const sets = new LocalStorageRepository<LiftSet>('sets', storage);
  exercises.save({ id: 'squat', name: 'Back Squat', muscleGroup: 'Legs' });
  exercises.save({ id: 'bench', name: 'Bench Press', muscleGroup: 'Chest' });
  render(<LiftLog service={new LiftService(exercises, sessions, sets)} user={ava} />);
  return { sets, sessions };
}

function logSet(exercise: string, weight: string, reps: string) {
  userEvent.selectOptions(screen.getByLabelText('Exercise'), exercise);
  userEvent.clear(screen.getByLabelText('Weight (lbs)'));
  userEvent.type(screen.getByLabelText('Weight (lbs)'), weight);
  userEvent.clear(screen.getByLabelText('Reps'));
  userEvent.type(screen.getByLabelText('Reps'), reps);
  userEvent.click(screen.getByRole('button', { name: 'Log set' }));
}

describe('Integration: lift logging', () => {
  it('logging a set saves it and shows it in that exercise\'s history', () => {
    const { sets, sessions } = renderLiftLog();
    expect(screen.getByText('No sets logged yet')).toBeTruthy();

    logSet('bench', '135', '8');
    expect(screen.getByRole('status').textContent).toBe('Logged set 1: Bench Press, 135 lbs x 8');
    expect(sets.findAll()).toHaveLength(1);
    expect(sessions.findAll()).toHaveLength(1);
    const row = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(within(row).getAllByRole('cell').map((c) => c.textContent).slice(1)).toEqual(['1', '135', '8']);
  });

  it('a second set of the same exercise is numbered 2, and switching exercise switches the history', () => {
    renderLiftLog();
    logSet('bench', '135', '8');
    logSet('bench', '145', '6');
    expect(screen.getByRole('status').textContent).toBe('Logged set 2: Bench Press, 145 lbs x 6');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3); // header + 2 sets

    userEvent.selectOptions(screen.getByLabelText('Exercise'), 'squat');
    expect(screen.getByText('History: Back Squat')).toBeTruthy();
    expect(screen.getByText('No sets logged yet')).toBeTruthy();
  });

  it('invalid input shows the service\'s errors and saves nothing', () => {
    const { sets } = renderLiftLog();
    logSet('bench', '-10', '0');
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toEqual([
      'Weight must be between 0 and 2000 lbs',
      'Reps must be a whole number from 1 to 100',
    ]);
    expect(sets.findAll()).toEqual([]);
  });
});
