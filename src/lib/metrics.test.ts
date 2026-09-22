import { describe, it, expect } from 'vitest';
import {
  confusionMatrix,
  accuracyFrom,
  precisionFrom,
  recallFrom,
  toPredictions,
  computeMetrics,
  binaryCrossEntropy,
} from './metrics';

describe('metrics', () => {
  it('toPredictions usa umbral 0.5', () => {
    expect(toPredictions([0.1, 0.5, 0.9])).toEqual([0, 1, 1]);
  });

  it('confusion matrix correcta', () => {
    const yTrue = [1, 1, 0, 0, 1];
    const yPred = [1, 0, 0, 1, 1];
    const cm = confusionMatrix(yTrue, yPred);
    expect(cm).toEqual({
      truePositive: 2,
      trueNegative: 1,
      falsePositive: 1,
      falseNegative: 1,
    });
  });

  it('accuracy, precision, recall', () => {
    const cm = confusionMatrix([1, 1, 0, 0, 1], [1, 0, 0, 1, 1]);
    expect(accuracyFrom(cm)).toBeCloseTo(3 / 5);
    expect(precisionFrom(cm)).toBeCloseTo(2 / 3);
    expect(recallFrom(cm)).toBeCloseTo(2 / 3);
  });

  it('metricas con clasificacion perfecta', () => {
    const yTrue = [1, 0, 1, 0];
    const probs = [0.99, 0.01, 0.8, 0.2];
    const m = computeMetrics(yTrue, probs, 10, 0.05);
    expect(m.accuracy).toBe(1);
    expect(m.precision).toBe(1);
    expect(m.recall).toBe(1);
    expect(m.epochsRun).toBe(10);
  });

  it('binaryCrossEntropy es baja para predicciones correctas', () => {
    const bce = binaryCrossEntropy([1, 0], [0.99, 0.01]);
    expect(bce).toBeLessThan(0.05);
  });

  it('binaryCrossEntropy es alta para predicciones erroneas', () => {
    const bce = binaryCrossEntropy([1, 0], [0.01, 0.99]);
    expect(bce).toBeGreaterThan(1);
  });
});
