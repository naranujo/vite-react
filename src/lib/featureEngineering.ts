import type { RawRow, TargetRepresentation } from '../types/dataset';
import { FEATURE_DEFINITIONS, type FeatureDefinition } from '../config/features';

/**
 * Feature engineering en memoria.
 *
 * A partir de las features originales (x, y) construye la matriz de inputs
 * segun las features seleccionadas por el alumno. El orden de columnas respeta
 * el orden de FEATURE_DEFINITIONS.
 */

/**
 * Devuelve las definiciones seleccionadas, en el orden de FEATURE_DEFINITIONS.
 * Cualquier feature (incluidas x e y) puede estar ausente.
 */
export function resolveSelectedFeatures(selectedIds: string[]): FeatureDefinition[] {
  const idSet = new Set(selectedIds);
  return FEATURE_DEFINITIONS.filter((f) => idSet.has(f.id));
}

/** Construye la matriz de features [n][d] a partir de las filas y las features elegidas. */
export function buildFeatureMatrix(
  rows: RawRow[],
  selectedIds: string[],
): number[][] {
  const features = resolveSelectedFeatures(selectedIds);
  return rows.map((r) => features.map((f) => f.compute({ x: r.x, y: r.y })));
}

/** Construye una fila de features para un punto arbitrario (x, y). Util para el grid. */
export function buildFeatureRow(
  x: number,
  y: number,
  selectedIds: string[],
): number[] {
  const features = resolveSelectedFeatures(selectedIds);
  return features.map((f) => f.compute({ x, y }));
}

/**
 * Etiquetas internas para el entrenamiento: SIEMPRE {0, 1}.
 * -1/0 -> 0, +1 -> 1. Esto es independiente de la representacion visual.
 */
export function buildBinaryLabels(rows: RawRow[]): number[] {
  return rows.map((r) => (r.z === 1 ? 1 : 0));
}

/** Numero de inputs de la red segun las features seleccionadas. */
export function inputSizeFor(selectedIds: string[]): number {
  return resolveSelectedFeatures(selectedIds).length;
}

/** Etiquetas de las features seleccionadas (para mostrar en la UI). */
export function selectedFeatureLabels(selectedIds: string[]): string[] {
  return resolveSelectedFeatures(selectedIds).map((f) => f.label);
}

/**
 * Convierte una etiqueta interna (0/1) a la representacion elegida por el alumno.
 * Solo afecta la visualizacion / metricas mostradas, no el entrenamiento.
 */
export function labelForRepresentation(
  internal: 0 | 1,
  rep: TargetRepresentation,
): number {
  if (rep === 'pm1') return internal === 1 ? 1 : -1;
  return internal;
}

/** Nombres de clase para mostrar (negativa, positiva) segun la representacion. */
export function classNames(rep: TargetRepresentation): [string, string] {
  return rep === 'pm1' ? ['-1', '+1'] : ['0', '1'];
}
