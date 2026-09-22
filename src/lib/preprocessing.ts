import type { PreprocessingMode } from '../config/training';

/**
 * Preprocesamiento de features controlado por configuracion docente.
 *
 * Aprende los parametros de escalado sobre la matriz de entrenamiento y permite
 * reaplicarlos de forma consistente a nuevos puntos (por ejemplo, el grid de la
 * frontera de decision).
 */

export interface Scaler {
  mode: PreprocessingMode;
  /** Parametro de centrado por columna (min o media). */
  center: number[];
  /** Parametro de escala por columna (rango o desvio). */
  scale: number[];
}

/** Aprende el scaler segun el modo. Para 'none' devuelve identidad. */
export function fitScaler(matrix: number[][], mode: PreprocessingMode): Scaler {
  const d = matrix[0]?.length ?? 0;
  const center = new Array<number>(d).fill(0);
  const scale = new Array<number>(d).fill(1);

  if (mode === 'none' || matrix.length === 0) {
    return { mode, center, scale };
  }

  for (let j = 0; j < d; j++) {
    if (mode === 'normalize') {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < matrix.length; i++) {
        const v = matrix[i][j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      center[j] = min;
      const range = max - min;
      scale[j] = range === 0 ? 1 : range;
    } else {
      // standardize
      let sum = 0;
      for (let i = 0; i < matrix.length; i++) sum += matrix[i][j];
      const mean = sum / matrix.length;
      let sq = 0;
      for (let i = 0; i < matrix.length; i++) {
        const diff = matrix[i][j] - mean;
        sq += diff * diff;
      }
      const std = Math.sqrt(sq / matrix.length);
      center[j] = mean;
      scale[j] = std === 0 ? 1 : std;
    }
  }

  return { mode, center, scale };
}

/** Aplica el scaler a una matriz, devolviendo una nueva matriz. */
export function transformMatrix(matrix: number[][], scaler: Scaler): number[][] {
  if (scaler.mode === 'none') return matrix.map((row) => row.slice());
  return matrix.map((row) =>
    row.map((v, j) => (v - scaler.center[j]) / scaler.scale[j]),
  );
}

/** Aplica el scaler a una unica fila. */
export function transformRow(row: number[], scaler: Scaler): number[] {
  if (scaler.mode === 'none') return row.slice();
  return row.map((v, j) => (v - scaler.center[j]) / scaler.scale[j]);
}
