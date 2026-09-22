import Papa from 'papaparse';
import type { Dataset, RawRow } from '../types/dataset';

/**
 * Parseo y validacion del dataset.
 *
 * Reglas:
 *  - separador de columnas: ','
 *  - separador decimal: '.'  (NO se usa la configuracion regional del navegador)
 *  - columnas exactas: x, y, z
 *  - x, y numericos; z usa una unica codificacion binaria: -1/+1 o 0/1
 *  - sin vacios, sin NaN, sin Infinity
 *
 * El CSV original nunca se modifica: todo ocurre en memoria.
 */

export class DatasetError extends Error {}

/** Convierte un string a numero usando '.' como separador decimal, de forma estricta. */
function parseStrictNumber(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new DatasetError('Se encontro un valor vacio en el dataset.');
  }
  // Aceptamos formato con punto decimal, notacion cientifica y signo.
  // Rechazamos cualquier caracter no numerico (incluida coma decimal).
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) {
    throw new DatasetError(
      `Valor no numerico o con formato invalido: "${value}". Use '.' como separador decimal.`,
    );
  }
  const n = Number(trimmed);
  if (Number.isNaN(n)) {
    throw new DatasetError(`No se pudo interpretar "${value}" como numero.`);
  }
  if (!Number.isFinite(n)) {
    throw new DatasetError(`Se encontro un valor infinito: "${value}".`);
  }
  return n;
}

/** Parsea el texto del CSV y devuelve un Dataset validado, o lanza DatasetError. */
export function parseDataset(csvText: string): Dataset {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    delimiter: ',',
    skipEmptyLines: 'greedy',
    // Importante: NO usar dynamicTyping para controlar nosotros el parseo decimal.
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    const first = result.errors[0];
    throw new DatasetError(`Error al parsear el CSV: ${first.message}`);
  }

  const fields = result.meta.fields ?? [];
  const required = ['x', 'y', 'z'];
  for (const col of required) {
    if (!fields.includes(col)) {
      throw new DatasetError(
        `Falta la columna "${col}". El header debe ser exactamente: x,y,z`,
      );
    }
  }

  const data = result.data;
  if (data.length === 0) {
    throw new DatasetError('El dataset no contiene filas.');
  }

  const rows: RawRow[] = [];
  data.forEach((record, index) => {
    const lineNo = index + 2; // +1 header, +1 base-1
    const xRaw = record.x;
    const yRaw = record.y;
    const zRaw = record.z;

    if (xRaw === undefined || yRaw === undefined || zRaw === undefined) {
      throw new DatasetError(`Fila ${lineNo}: faltan columnas.`);
    }

    let x: number;
    let y: number;
    let z: number;
    try {
      x = parseStrictNumber(xRaw);
      y = parseStrictNumber(yRaw);
      z = parseStrictNumber(zRaw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new DatasetError(`Fila ${lineNo}: ${msg}`);
    }

    if (z !== -1 && z !== 0 && z !== 1) {
      throw new DatasetError(
        `Fila ${lineNo}: el target "z" debe ser -1/+1 o 0/1, se encontro "${zRaw}".`,
      );
    }

    rows.push({ x, y, z: z as RawRow['z'] });
  });

  const hasMinusOne = rows.some((row) => row.z === -1);
  const hasZero = rows.some((row) => row.z === 0);
  if (hasMinusOne && hasZero) {
    throw new DatasetError(
      'El target "z" no puede mezclar las codificaciones -1/+1 y 0/1.',
    );
  }

  const targetClasses: Dataset['targetClasses'] = hasMinusOne ? [-1, 1] : [0, 1];

  return {
    rows,
    count: rows.length,
    originalFeatures: ['x', 'y'],
    targetName: 'z',
    targetClasses,
  };
}

/** Carga el dataset desde /data.csv (mismo deploy). No usa APIs externas. */
export async function loadDataset(url = '/data.csv'): Promise<Dataset> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store' });
  } catch {
    throw new DatasetError('No se pudo acceder a /data.csv.');
  }
  if (!response.ok) {
    throw new DatasetError(
      `No se encontro ${url} (HTTP ${response.status}). Coloque el archivo en public/data.csv.`,
    );
  }
  const text = await response.text();
  return parseDataset(text);
}
