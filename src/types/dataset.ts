/** Tipos relacionados con el dataset. */

/** Una fila cruda del CSV, ya validada como numerica. */
export interface RawRow {
  x: number;
  y: number;
  /** Target original: -1/+1 o 0/1, segun la codificacion del CSV. */
  z: -1 | 0 | 1;
}

/** Dataset cargado y validado en memoria. El CSV original nunca se modifica. */
export interface Dataset {
  rows: RawRow[];
  count: number;
  /** Nombres de features originales. */
  originalFeatures: ['x', 'y'];
  targetName: 'z';
  /** Valores posibles del target original. */
  targetClasses: [-1, 1] | [0, 1];
}

/** Representacion elegida por el alumno para el target. */
export type TargetRepresentation = 'pm1' | 'zero_one';

export interface ValidationError {
  message: string;
}
