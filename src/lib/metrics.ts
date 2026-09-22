import type { ConfusionMatrix, Metrics } from '../types/training';
import type { LossName } from '../config/training';

/**
 * Calculo de metricas localmente. Etiquetas internas: 0 (negativa) y 1 (positiva).
 * Clase positiva = 1.
 */

/** Umbral estandar para salida sigmoid. */
export const DECISION_THRESHOLD = 0.5;

/** Convierte probabilidades a predicciones binarias {0,1}. */
export function toPredictions(
  probabilities: number[],
  threshold = DECISION_THRESHOLD,
): number[] {
  return probabilities.map((p) => (p >= threshold ? 1 : 0));
}

/** Calcula la matriz de confusion a partir de y verdadero y predicho (0/1). */
export function confusionMatrix(
  yTrue: number[],
  yPred: number[],
): ConfusionMatrix {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const t = yTrue[i];
    const p = yPred[i];
    if (t === 1 && p === 1) tp++;
    else if (t === 0 && p === 0) tn++;
    else if (t === 0 && p === 1) fp++;
    else if (t === 1 && p === 0) fn++;
  }
  return { truePositive: tp, trueNegative: tn, falsePositive: fp, falseNegative: fn };
}

export function accuracyFrom(cm: ConfusionMatrix): number {
  const total =
    cm.truePositive + cm.trueNegative + cm.falsePositive + cm.falseNegative;
  if (total === 0) return 0;
  return (cm.truePositive + cm.trueNegative) / total;
}

export function precisionFrom(cm: ConfusionMatrix): number {
  const denom = cm.truePositive + cm.falsePositive;
  if (denom === 0) return 0;
  return cm.truePositive / denom;
}

export function recallFrom(cm: ConfusionMatrix): number {
  const denom = cm.truePositive + cm.falseNegative;
  if (denom === 0) return 0;
  return cm.truePositive / denom;
}

/** Binary cross-entropy media (con clamping para evitar log(0)). */
export function binaryCrossEntropy(
  yTrue: number[],
  probabilities: number[],
): number {
  const eps = 1e-7;
  let sum = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const p = Math.min(1 - eps, Math.max(eps, probabilities[i]));
    sum += -(yTrue[i] * Math.log(p) + (1 - yTrue[i]) * Math.log(1 - p));
  }
  return yTrue.length === 0 ? 0 : sum / yTrue.length;
}

/** Error cuadratico medio. */
export function meanSquaredError(yTrue: number[], predictions: number[]): number {
  let sum = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const diff = predictions[i] - yTrue[i];
    sum += diff * diff;
  }
  return yTrue.length === 0 ? 0 : sum / yTrue.length;
}

/** Calcula la loss coherente con la configuracion docente. */
export function computeLoss(
  loss: LossName,
  yTrue: number[],
  outputs: number[],
): number {
  return loss === 'meanSquaredError'
    ? meanSquaredError(yTrue, outputs)
    : binaryCrossEntropy(yTrue, outputs);
}

/** Ensambla todas las metricas finales a partir de probabilidades y target 0/1. */
export function computeMetrics(
  yTrue: number[],
  probabilities: number[],
  epochsRun: number,
  finalLoss: number,
): Metrics {
  const yPred = toPredictions(probabilities);
  const cm = confusionMatrix(yTrue, yPred);
  return {
    epochsRun,
    loss: finalLoss,
    accuracy: accuracyFrom(cm),
    precision: precisionFrom(cm),
    recall: recallFrom(cm),
    confusion: cm,
  };
}
