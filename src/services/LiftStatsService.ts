import type { LiftEntry } from '../domain/lifts/LiftEntry';
import { EpleyFormula } from '../domain/lifts/oneRepMaxFormulas';
import type { OneRepMaxFormula } from '../domain/lifts/oneRepMaxFormulas';

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Strategy pattern context: delegates the math to the current formula. */
export class LiftStatsService {
  private formula: OneRepMaxFormula;

  constructor(formula: OneRepMaxFormula = new EpleyFormula()) {
    this.formula = formula;
  }

  useFormula(f: OneRepMaxFormula): void {
    this.formula = f;
  }

  get formulaLabel(): string {
    return this.formula.label;
  }

  /** Estimated one rep max, rounded to 0.1 lb. */
  estimateMax(entry: LiftEntry): number {
    return round1(this.formula.estimate(entry.weight, entry.reps));
  }

  /** Best estimated max for an exercise, or 0 if there are no entries. */
  bestEstimatedMax(entries: LiftEntry[], exercise: string): number {
    let best = 0;
    for (const e of entries) {
      if (e.exercise !== exercise) continue;
      best = Math.max(best, this.estimateMax(e));
    }
    return best;
  }
}
