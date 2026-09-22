/** Resultado de proyectar una matriz de features a sus primeras componentes. */
export interface PcaProjection {
  points: [number, number][];
  explainedVariance: [number, number];
}

/**
 * Proyecta features a dos dimensiones mediante PCA.
 *
 * Las columnas se estandarizan antes de calcular la covarianza para que una
 * feature derivada de mayor escala no domine la proyeccion solo por sus
 * unidades. La implementacion es local y no requiere librerias externas.
 */
export function projectPca2d(matrix: number[][]): PcaProjection {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  if (rows === 0 || cols === 0) {
    return { points: [], explainedVariance: [0, 0] };
  }

  const means = Array.from({ length: cols }, (_, col) =>
    matrix.reduce((sum, row) => sum + row[col], 0) / rows,
  );
  const scales = Array.from({ length: cols }, (_, col) => {
    const variance =
      matrix.reduce((sum, row) => sum + (row[col] - means[col]) ** 2, 0) /
      rows;
    return Math.sqrt(variance) || 1;
  });
  const normalized = matrix.map((row) =>
    row.map((value, col) => (value - means[col]) / scales[col]),
  );
  const covariance = Array.from({ length: cols }, (_, left) =>
    Array.from(
      { length: cols },
      (_, right) =>
        normalized.reduce((sum, row) => sum + row[left] * row[right], 0) /
        rows,
    ),
  );
  const { values, vectors } = jacobiEigenDecomposition(covariance);
  const order = values.map((_, index) => index).sort((a, b) => values[b] - values[a]);
  const first = order[0];
  const second = order[1];
  const totalVariance = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  const ratio = (index: number | undefined) =>
    index === undefined || totalVariance === 0
      ? 0
      : Math.max(0, values[index]) / totalVariance;

  return {
    points: normalized.map((row) => [
      dot(row, vectors.map((vector) => vector[first])),
      second === undefined ? 0 : dot(row, vectors.map((vector) => vector[second])),
    ]),
    explainedVariance: [ratio(first), ratio(second)],
  };
}

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

/** Descomposicion propia para una matriz simetrica con rotaciones de Jacobi. */
function jacobiEigenDecomposition(input: number[][]): {
  values: number[];
  vectors: number[][];
} {
  const size = input.length;
  const matrix = input.map((row) => row.slice());
  const vectors: number[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)),
  );

  for (let iteration = 0; iteration < size * size * 20; iteration += 1) {
    let left = 0;
    let right = 1;
    let largest = 0;
    for (let row = 0; row < size; row += 1) {
      for (let col = row + 1; col < size; col += 1) {
        if (Math.abs(matrix[row][col]) > largest) {
          largest = Math.abs(matrix[row][col]);
          left = row;
          right = col;
        }
      }
    }
    if (largest < 1e-10) break;

    const angle = 0.5 * Math.atan2(2 * matrix[left][right], matrix[right][right] - matrix[left][left]);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const leftDiagonal = matrix[left][left];
    const rightDiagonal = matrix[right][right];
    const cross = matrix[left][right];

    matrix[left][left] = cosine ** 2 * leftDiagonal - 2 * sine * cosine * cross + sine ** 2 * rightDiagonal;
    matrix[right][right] = sine ** 2 * leftDiagonal + 2 * sine * cosine * cross + cosine ** 2 * rightDiagonal;
    matrix[left][right] = 0;
    matrix[right][left] = 0;
    for (let index = 0; index < size; index += 1) {
      if (index === left || index === right) continue;
      const leftValue = matrix[index][left];
      const rightValue = matrix[index][right];
      matrix[index][left] = cosine * leftValue - sine * rightValue;
      matrix[left][index] = matrix[index][left];
      matrix[index][right] = sine * leftValue + cosine * rightValue;
      matrix[right][index] = matrix[index][right];

      const leftVector = vectors[index][left];
      const rightVector = vectors[index][right];
      vectors[index][left] = cosine * leftVector - sine * rightVector;
      vectors[index][right] = sine * leftVector + cosine * rightVector;
    }
  }

  return { values: matrix.map((row, index) => row[index]), vectors };
}
