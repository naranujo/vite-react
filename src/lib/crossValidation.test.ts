import { describe, it, expect } from 'vitest';
import { kFold, aggregateCvMetrics } from './crossValidation';
import type { Metrics } from '../types/training';

function metric(acc: number, prec: number, rec: number, loss: number): Metrics {
  return {
    epochsRun: 10,
    loss,
    accuracy: acc,
    precision: prec,
    recall: rec,
    confusion: {
      truePositive: 0,
      trueNegative: 0,
      falsePositive: 0,
      falseNegative: 0,
    },
  };
}

describe('kFold', () => {
  it('genera k folds y cada muestra valida exactamente una vez', () => {
    const n = 20;
    const k = 5;
    const folds = kFold(n, k, true, 42);
    expect(folds.length).toBe(k);

    const seenVal = new Set<number>();
    for (const f of folds) {
      // train y val son disjuntos y cubren todo n
      const set = new Set([...f.trainIndices, ...f.valIndices]);
      expect(set.size).toBe(n);
      for (const v of f.valIndices) {
        expect(seenVal.has(v)).toBe(false);
        seenVal.add(v);
      }
    }
    expect(seenVal.size).toBe(n);
  });

  it('es reproducible con la misma semilla', () => {
    const a = kFold(30, 5, true, 7);
    const b = kFold(30, 5, true, 7);
    expect(a[0].valIndices).toEqual(b[0].valIndices);
  });

  it('sin shuffle particiona de forma contigua-modular', () => {
    const folds = kFold(10, 5, false, 0);
    // fold 0 valida indices 0 y 5 (i % 5 === 0)
    expect(folds[0].valIndices).toEqual([0, 5]);
  });

  it('acota k al rango [2, n]', () => {
    expect(kFold(3, 100, false, 0).length).toBe(3);
    expect(kFold(10, 1, false, 0).length).toBe(2);
  });
});

describe('aggregateCvMetrics', () => {
  it('calcula media y desvio', () => {
    const per = [
      metric(0.8, 0.7, 0.6, 0.5),
      metric(0.6, 0.5, 0.4, 0.3),
    ];
    const agg = aggregateCvMetrics(per);
    expect(agg.folds).toBe(2);
    expect(agg.accuracyMean).toBeCloseTo(0.7);
    expect(agg.accuracyStd).toBeCloseTo(0.1);
    expect(agg.lossMean).toBeCloseTo(0.4);
  });
});
