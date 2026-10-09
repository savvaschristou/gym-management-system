/**
 * BEFORE: one rep max estimation with an if/else chain.
 *
 * Problems with this version:
 *  1. Every new formula means editing the chain (closed for extension? no).
 *  2. Formulas are magic strings, so a typo only fails at runtime.
 *  3. Formula-specific rules (like Brzycki's rep limit) are mixed together
 *     in one function.
 *  4. There is no list of formulas, so the UI cannot build a dropdown.
 *
 * Nothing in the app imports this file. See
 * src/domain/lifts/oneRepMaxFormulas.ts for the Strategy pattern version.
 */

export interface BeforeLiftEntry {
  exercise: string;
  weight: number;
  reps: number;
}

export function estimateOneRepMax(
  weight: number,
  reps: number,
  formula: string
): number {
  if (reps === 1) return weight;

  if (formula === 'epley') {
    return weight * (1 + reps / 30);
  } else if (formula === 'brzycki') {
    if (reps >= 37) throw new RangeError('Brzycki needs fewer than 37 reps');
    return (weight * 36) / (37 - reps);
  } else if (formula === 'lombardi') {
    return weight * Math.pow(reps, 0.1);
  }
  throw new Error(`Unknown formula: ${formula}`);
}

export function bestEstimatedMax(
  entries: BeforeLiftEntry[],
  exercise: string,
  formula: string
): number {
  let best = 0;
  for (const e of entries) {
    if (e.exercise !== exercise) continue;
    best = Math.max(best, estimateOneRepMax(e.weight, e.reps, formula));
  }
  return best;
}
