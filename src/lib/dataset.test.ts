import { describe, it, expect } from 'vitest';
import { parseDataset, DatasetError } from './dataset';

describe('parseDataset', () => {
  it('parsea un CSV valido', () => {
    const csv = 'x,y,z\n0.25,0.80,-1\n0.42,0.31,1\n';
    const ds = parseDataset(csv);
    expect(ds.count).toBe(2);
    expect(ds.rows[0]).toEqual({ x: 0.25, y: 0.8, z: -1 });
    expect(ds.rows[1]).toEqual({ x: 0.42, y: 0.31, z: 1 });
  });

  it('acepta la codificacion original 0/1', () => {
    const csv = 'x,y,z\n0.25,0.80,0\n0.42,0.31,1\n';
    const ds = parseDataset(csv);
    expect(ds.rows).toEqual([
      { x: 0.25, y: 0.8, z: 0 },
      { x: 0.42, y: 0.31, z: 1 },
    ]);
    expect(ds.targetClasses).toEqual([0, 1]);
  });

  it('usa . como separador decimal y rechaza coma decimal', () => {
    const csv = 'x,y,z\n0,25,0,80,-1\n';
    expect(() => parseDataset(csv)).toThrow(DatasetError);
  });

  it('rechaza columnas faltantes', () => {
    const csv = 'x,y\n0.1,0.2\n';
    expect(() => parseDataset(csv)).toThrow(/columna/);
  });

  it('rechaza target que no pertenece a una codificacion binaria valida', () => {
    const csv = 'x,y,z\n0.1,0.2,2\n';
    expect(() => parseDataset(csv)).toThrow(/-1\/\+1 o 0\/1/);
  });

  it('rechaza mezclar las codificaciones -1/+1 y 0/1', () => {
    const csv = 'x,y,z\n0.1,0.2,-1\n0.3,0.4,0\n';
    expect(() => parseDataset(csv)).toThrow(/no puede mezclar/);
  });

  it('rechaza valores no numericos', () => {
    const csv = 'x,y,z\nabc,0.2,1\n';
    expect(() => parseDataset(csv)).toThrow(DatasetError);
  });

  it('rechaza valores vacios', () => {
    const csv = 'x,y,z\n,0.2,1\n';
    expect(() => parseDataset(csv)).toThrow(DatasetError);
  });

  it('rechaza Infinity', () => {
    const csv = 'x,y,z\nInfinity,0.2,1\n';
    expect(() => parseDataset(csv)).toThrow(DatasetError);
  });

  it('rechaza dataset vacio', () => {
    const csv = 'x,y,z\n';
    expect(() => parseDataset(csv)).toThrow(/no contiene filas/);
  });

  it('acepta notacion cientifica', () => {
    const csv = 'x,y,z\n1e-2,2.5e1,1\n';
    const ds = parseDataset(csv);
    expect(ds.rows[0].x).toBeCloseTo(0.01);
    expect(ds.rows[0].y).toBeCloseTo(25);
  });
});
