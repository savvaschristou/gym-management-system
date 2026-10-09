/**
 * STRATEGY PATTERN: each formula is its own class behind one interface.
 *
 * Compared with oneRepMax.before.ts:
 *  - Adding a formula means adding a class and listing it in
 *    ONE_REP_MAX_FORMULAS. No existing code changes.
 *  - Callers pass a formula object, not a magic string, so the compiler
 *    catches mistakes.
 *  - Each formula keeps its own rules (Brzycki's 37 rep limit lives only in
 *    BrzyckiFormula).
 *  - ONE_REP_MAX_FORMULAS gives the UI a list to build a dropdown from.
 */

export interface OneRepMaxFormula {
  readonly id: string;
  readonly label: string;
  estimate(weight: number, reps: number): number;
}

/** Shared input check: weight > 0 and reps a whole number >= 1. */
function assertValidInput(weight: number, reps: number): void {
  if (!(weight > 0)) {
    throw new RangeError('Weight must be greater than 0');
  }
  if (!Number.isInteger(reps) || reps < 1) {
    throw new RangeError('Reps must be a whole number of at least 1');
  }
}

export class EpleyFormula implements OneRepMaxFormula {
  readonly id = 'epley';
  readonly label = 'Epley';

  estimate(weight: number, reps: number): number {
    assertValidInput(weight, reps);
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }
}

export class BrzyckiFormula implements OneRepMaxFormula {
  readonly id = 'brzycki';
  readonly label = 'Brzycki';

  estimate(weight: number, reps: number): number {
    assertValidInput(weight, reps);
    if (reps === 1) return weight;
    // Brzycki's own rule: the denominator hits zero at 37 reps.
    if (reps >= 37) throw new RangeError('Brzycki needs fewer than 37 reps');
    return (weight * 36) / (37 - reps);
  }
}

export class LombardiFormula implements OneRepMaxFormula {
  readonly id = 'lombardi';
  readonly label = 'Lombardi';

  estimate(weight: number, reps: number): number {
    assertValidInput(weight, reps);
    if (reps === 1) return weight;
    return weight * Math.pow(reps, 0.1);
  }
}

export const ONE_REP_MAX_FORMULAS: readonly OneRepMaxFormula[] = [
  new EpleyFormula(),
  new BrzyckiFormula(),
  new LombardiFormula(),
];

/** Looks up a formula by id, falling back to Epley for unknown ids. */
export function formulaById(id: string): OneRepMaxFormula {
  return (
    ONE_REP_MAX_FORMULAS.find((f) => f.id === id) ?? ONE_REP_MAX_FORMULAS[0]
  );
}
