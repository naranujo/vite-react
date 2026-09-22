import { describe, it, expect } from 'vitest';
import { fitScaler, transformMatrix, transformRow } from './preprocessing';

const matrix = [
  [0, 10],
  [2, 20],
  [4, 30],
];

describe('preprocessing', () => {
  it('none no modifica los datos', () => {
    const s = fitScaler(matrix, 'none');
    expect(transformMatrix(matrix, s)).toEqual(matrix);
  });

  it('normalize escala a [0,1]', () => {
    const s = fitScaler(matrix, 'normalize');
    const out = transformMatrix(matrix, s);
    expect(out[0]).toEqual([0, 0]);
    expect(out[2]).toEqual([1, 1]);
  });

  it('standardize produce media 0', () => {
    const s = fitScaler(matrix, 'standardize');
    const out = transformMatrix(matrix, s);
    const col0Mean = (out[0][0] + out[1][0] + out[2][0]) / 3;
    expect(col0Mean).toBeCloseTo(0);
    // el valor central se mapea a 0
    expect(out[1][0]).toBeCloseTo(0);
  });

  it('transformRow reaplica el mismo escalado', () => {
    const s = fitScaler(matrix, 'normalize');
    expect(transformRow([2, 20], s)).toEqual([0.5, 0.5]);
  });

  it('columna constante no produce division por cero', () => {
    const constMatrix = [
      [5, 1],
      [5, 2],
    ];
    const s = fitScaler(constMatrix, 'standardize');
    const out = transformMatrix(constMatrix, s);
    expect(Number.isFinite(out[0][0])).toBe(true);
  });
});
