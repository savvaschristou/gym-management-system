import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SessionUser } from '../domain/auth/User';
import type { LiftService } from '../services/lifts/LiftService';

/**
 * The member's lift log: pick an exercise, enter weight and reps, log the
 * set, and see the history for that exercise underneath. Rules (validation,
 * sessions, set numbers) live in LiftService.
 */
interface LiftLogProps {
  service: LiftService;
  user: SessionUser;
}

export default function LiftLog({ service, user }: LiftLogProps) {
  const exercises = service.listExercises();
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const exerciseName = exercises.find((e) => e.id === exerciseId)?.name ?? '';
  const history = exerciseId ? service.history(user, exerciseId) : [];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = service.logSet(user, { exerciseId, weightLbs: Number(weight), reps: Number(reps) });
    if (!result.ok) {
      setErrors(result.errors);
      setMessage('');
      return;
    }
    setErrors([]);
    setMessage(`Logged set ${result.set.setNumber}: ${result.exercise.name}, ${result.set.weightLbs} lbs x ${result.set.reps}`);
    setReps('');
  }

  return (
    <section>
      <h2>Log a lift</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="exercise">Exercise</label>{' '}
        <select id="exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>{' '}
        <label htmlFor="weight">Weight (lbs)</label>{' '}
        <input id="weight" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />{' '}
        <label htmlFor="reps">Reps</label>{' '}
        <input id="reps" type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />{' '}
        <button type="submit">Log set</button>
      </form>
      {errors.map((err) => (
        <p key={err} role="alert">
          {err}
        </p>
      ))}
      {message && <p role="status">{message}</p>}

      <h3>History: {exerciseName}</h3>
      {history.length === 0 ? (
        <p>No sets logged yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Set</th>
              <th>Weight (lbs)</th>
              <th>Reps</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={`${row.date}-${row.setNumber}`}>
                <td>{row.date}</td>
                <td>{row.setNumber}</td>
                <td>{row.weightLbs}</td>
                <td>{row.reps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
