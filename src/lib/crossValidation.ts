import type { CrossValMetrics, Metrics } from '../types/training';

/**
 * Utilidades puras para k-fold cross-validation.
 */

/** Generador congruente lineal simple para una mezcla reproducible. */
function makeRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/** Mezcla Fisher-Yates de los indices 0..n-1 con semilla. */
function shuffledIndices(n: number, seed: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  const rng = makeRng(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export interface Fold {
  /** Indices usados para entrenar en este fold. */
  trainIndices: number[];
  /** Indices usados para validar en este fold. */
  valIndices: number[];
}

/**
 * Genera k folds. Cada muestra aparece exactamente una vez como validacion.
 * Si `shuffle` es false se particiona en bloques contiguos.
 */
export function kFold(
  n: number,
  k: number,
  shuffle: boolean,
  seed: number,
): Fold[] {
  const kk = Math.max(2, Math.min(k, n));
  const order = shuffle
    ? shuffledIndices(n, seed)
    : Array.from({ length: n }, (_, i) => i);

  const folds: Fold[] = [];
  for (let f = 0; f < kk; f++) {
    const valIndices: number[] = [];
    const trainIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      // Reparto balanceado: la muestra en posicion i va al fold i % kk.
      if (i % kk === f) valIndices.push(order[i]);
      else trainIndices.push(order[i]);
    }
    folds.push({ trainIndices, valIndices });
  }
  return folds;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[], m: number): number {
  if (values.length === 0) return 0;
  const v = values.reduce((a, b) => a + (b - m) * (b - m), 0) / values.length;
  return Math.sqrt(v);
}

/** Agrega las metricas por fold en media y desvio. */
export function aggregateCvMetrics(perFold: Metrics[]): CrossValMetrics {
  const acc = perFold.map((m) => m.accuracy);
  const prec = perFold.map((m) => m.precision);
  const rec = perFold.map((m) => m.recall);
  const loss = perFold.map((m) => m.loss);
  const accM = mean(acc);
  const precM = mean(prec);
  const recM = mean(rec);
  const lossM = mean(loss);
  return {
    folds: perFold.length,
    accuracyMean: accM,
    accuracyStd: std(acc, accM),
    precisionMean: precM,
    precisionStd: std(prec, precM),
    recallMean: recM,
    recallStd: std(rec, recM),
    lossMean: lossM,
    lossStd: std(loss, lossM),
  };
}
