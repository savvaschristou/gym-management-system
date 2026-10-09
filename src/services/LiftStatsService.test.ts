import type { LiftEntry } from '../domain/lifts/LiftEntry';
import {
  BrzyckiFormula,
  EpleyFormula,
  LombardiFormula,
  formulaById,
} from '../domain/lifts/oneRepMaxFormulas';
import { estimateOneRepMax } from '../examples/before/oneRepMax.before';
import { LiftStatsService } from './LiftStatsService';

const entry = (exercise: string, weight: number, reps: number): LiftEntry => ({
  id: `${exercise}-${weight}-${reps}`,
  memberId: 'm1',
  exercise,
  weight,
  reps,
  date: '2026-10-01',
});

describe('one rep max formulas', () => {
  it('computes 200 lb x 5', () => {
    expect(new EpleyFormula().estimate(200, 5)).toBeCloseTo(233.33, 2);
    expect(new BrzyckiFormula().estimate(200, 5)).toBe(225);
    expect(new LombardiFormula().estimate(200, 5)).toBeCloseTo(234.92, 2);
  });

  it.each([1, 3, 8, 12])('matches the before function at %i reps', (reps) => {
    expect(new EpleyFormula().estimate(185, reps)).toBeCloseTo(estimateOneRepMax(185, reps, 'epley'), 10);
    expect(new BrzyckiFormula().estimate(185, reps)).toBeCloseTo(estimateOneRepMax(185, reps, 'brzycki'), 10);
    expect(new LombardiFormula().estimate(185, reps)).toBeCloseTo(estimateOneRepMax(185, reps, 'lombardi'), 10);
  });

  it('Brzycki throws at 37 reps and Epley does not', () => {
    expect(() => new BrzyckiFormula().estimate(100, 37)).toThrow(RangeError);
    expect(() => new EpleyFormula().estimate(100, 37)).not.toThrow();
  });

  it('throws on bad input', () => {
    const f = new EpleyFormula();
    expect(() => f.estimate(0, 5)).toThrow(RangeError);
    expect(() => f.estimate(-10, 5)).toThrow(RangeError);
    expect(() => f.estimate(100, 0)).toThrow(RangeError);
    expect(() => f.estimate(100, 2.5)).toThrow(RangeError);
    expect(() => f.estimate(NaN, 5)).toThrow(RangeError);
  });

  it('formulaById falls back to Epley', () => {
    expect(formulaById('brzycki')).toBeInstanceOf(BrzyckiFormula);
    expect(formulaById('nope')).toBeInstanceOf(EpleyFormula);
  });
});

describe('LiftStatsService', () => {
  const log = [entry('Bench', 185, 5), entry('Bench', 205, 1), entry('Squat', 275, 3)];

  it('finds the best Bench with Epley, then Brzycki', () => {
    const service = new LiftStatsService();
    expect(service.formulaLabel).toBe('Epley');
    expect(service.bestEstimatedMax(log, 'Bench')).toBe(215.8);
    service.useFormula(new BrzyckiFormula());
    expect(service.formulaLabel).toBe('Brzycki');
    expect(service.bestEstimatedMax(log, 'Bench')).toBe(208.1);
  });
});
