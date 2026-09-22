import type * as tfType from '@tensorflow/tfjs';
import { predictProbabilities } from './tensorflow';
import { buildFeatureRow } from './featureEngineering';
import { transformRow, type Scaler } from './preprocessing';

/**
 * Frontera de decision en el espacio original (x, y).
 *
 * Aunque la red use features derivadas (x^2, x*y, etc.), la frontera se
 * representa SIEMPRE sobre el plano x/y: para cada punto del grid se calculan
 * las features derivadas, se aplica el mismo preprocesamiento y se predice.
 */

export interface DecisionBoundaryData {
  /** Coordenadas x del grid (columnas). */
  xGrid: number[];
  /** Coordenadas y del grid (filas). */
  yGrid: number[];
  /** Matriz de probabilidades z[fila][columna], fila = y, columna = x. */
  z: number[][];
}

export interface BoundaryOptions {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number;
  selectedFeatureIds: string[];
  scaler: Scaler;
}

function linspace(min: number, max: number, n: number): number[] {
  if (n <= 1) return [min];
  const step = (max - min) / (n - 1);
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = min + step * i;
  return out;
}

export async function computeDecisionBoundary(
  model: tfType.LayersModel,
  opts: BoundaryOptions,
): Promise<DecisionBoundaryData> {
  const xGrid = linspace(opts.xMin, opts.xMax, opts.resolution);
  const yGrid = linspace(opts.yMin, opts.yMax, opts.resolution);

  // Construimos toda la matriz de features del grid y predecimos en un batch.
  const gridFeatures: number[][] = [];
  for (let yi = 0; yi < yGrid.length; yi++) {
    for (let xi = 0; xi < xGrid.length; xi++) {
      const row = buildFeatureRow(xGrid[xi], yGrid[yi], opts.selectedFeatureIds);
      gridFeatures.push(transformRow(row, opts.scaler));
    }
  }

  const probs = await predictProbabilities(model, gridFeatures);

  const z: number[][] = [];
  let idx = 0;
  for (let yi = 0; yi < yGrid.length; yi++) {
    const rowArr = new Array<number>(xGrid.length);
    for (let xi = 0; xi < xGrid.length; xi++) {
      rowArr[xi] = probs[idx++];
    }
    z.push(rowArr);
  }

  return { xGrid, yGrid, z };
}
