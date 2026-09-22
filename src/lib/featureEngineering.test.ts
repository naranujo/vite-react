import { describe, it, expect } from 'vitest';
import {
  buildFeatureMatrix,
  buildFeatureRow,
  buildBinaryLabels,
  inputSizeFor,
  labelForRepresentation,
  classNames,
} from './featureEngineering';
import type { RawRow } from '../types/dataset';

const rows: RawRow[] = [
  { x: 2, y: 3, z: 1 },
  { x: -1, y: 4, z: -1 },
];

describe('feature engineering', () => {
  it('construye la matriz con x e y en orden', () => {
    const m = buildFeatureMatrix(rows, ['x', 'y']);
    expect(m).toEqual([
      [2, 3],
      [-1, 4],
    ]);
  });

  it('agrega features derivadas en el orden de definicion', () => {
    const m = buildFeatureMatrix(rows, ['x', 'y', 'x2', 'xy']);
    // orden: x, y, xy, x2 (segun FEATURE_DEFINITIONS)
    expect(m[0]).toEqual([2, 3, 2 * 3, 2 * 2]);
    expect(m[1]).toEqual([-1, 4, -1 * 4, 1]);
  });

  it('computa sqrt(x^2 + y^2)', () => {
    const row = buildFeatureRow(3, 4, ['x', 'y', 'r']);
    expect(row).toEqual([3, 4, 5]);
  });

  it('permite desactivar x e y y usar solo features derivadas', () => {
    const m = buildFeatureMatrix(rows, ['x2']);
    expect(m[0]).toEqual([4]); // solo x2 = 2^2
    expect(m[1]).toEqual([1]); // (-1)^2
    expect(inputSizeFor(['x2'])).toBe(1);
  });

  it('respeta el orden de definicion en un subconjunto sin x', () => {
    // Seleccionar y, r (sin x): orden segun FEATURE_DEFINITIONS -> y, r
    const m = buildFeatureMatrix([{ x: 3, y: 4, z: 1 }], ['r', 'y']);
    expect(m[0]).toEqual([4, 5]); // y=4, r=sqrt(9+16)=5
  });

  it('etiquetas binarias: -1 -> 0, 1 -> 1', () => {
    expect(buildBinaryLabels(rows)).toEqual([1, 0]);
  });

  it('labelForRepresentation respeta representacion', () => {
    expect(labelForRepresentation(0, 'pm1')).toBe(-1);
    expect(labelForRepresentation(1, 'pm1')).toBe(1);
    expect(labelForRepresentation(0, 'zero_one')).toBe(0);
    expect(labelForRepresentation(1, 'zero_one')).toBe(1);
  });

  it('classNames', () => {
    expect(classNames('pm1')).toEqual(['-1', '+1']);
    expect(classNames('zero_one')).toEqual(['0', '1']);
  });
});
