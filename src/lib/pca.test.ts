import { describe, expect, it } from 'vitest';
import { projectPca2d } from './pca';

describe('projectPca2d', () => {
  it('proyecta datos correlacionados y conserva la varianza en la primera componente', () => {
    const projection = projectPca2d([
      [1, 1, 3],
      [2, 2, 6],
      [3, 3, 9],
    ]);

    expect(projection.points).toHaveLength(3);
    expect(projection.explainedVariance[0]).toBeCloseTo(1);
    expect(projection.explainedVariance[1]).toBeCloseTo(0);
  });

  it('maneja una unica columna', () => {
    const projection = projectPca2d([[1], [2], [3]]);
    expect(projection.points.map((point) => point[1])).toEqual([0, 0, 0]);
  });
});
