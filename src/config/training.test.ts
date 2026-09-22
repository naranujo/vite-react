import { describe, it, expect, vi } from 'vitest';
import {
  parseBatchSizeEnv,
  parseLearningRateEnv,
  parseLossEnv,
  parseMaxEpochsEnv,
  resolveBatchSize,
  TRAINING_CONFIG,
} from './training';

describe('parseBatchSizeEnv', () => {
  it('sin valor o vacio => full', () => {
    expect(parseBatchSizeEnv(undefined)).toBe('full');
    expect(parseBatchSizeEnv(null)).toBe('full');
    expect(parseBatchSizeEnv('')).toBe('full');
    expect(parseBatchSizeEnv('   ')).toBe('full');
  });

  it('"full" (cualquier caja) => full', () => {
    expect(parseBatchSizeEnv('full')).toBe('full');
    expect(parseBatchSizeEnv('FULL')).toBe('full');
  });

  it('entero positivo => ese numero', () => {
    expect(parseBatchSizeEnv('32')).toBe(32);
    expect(parseBatchSizeEnv(' 8 ')).toBe(8);
  });

  it('valores invalidos => full (con aviso)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseBatchSizeEnv('0')).toBe('full');
    expect(parseBatchSizeEnv('-4')).toBe('full');
    expect(parseBatchSizeEnv('3.5')).toBe('full');
    expect(parseBatchSizeEnv('abc')).toBe('full');
    warn.mockRestore();
  });
});

describe('resolveBatchSize', () => {
  it("'full' usa toda la muestra", () => {
    expect(resolveBatchSize({ ...TRAINING_CONFIG, batchSize: 'full' }, 500)).toBe(500);
  });

  it('numero se acota al tamano de la muestra', () => {
    expect(resolveBatchSize({ ...TRAINING_CONFIG, batchSize: 32 }, 500)).toBe(32);
    expect(resolveBatchSize({ ...TRAINING_CONFIG, batchSize: 999 }, 500)).toBe(500);
    expect(resolveBatchSize({ ...TRAINING_CONFIG, batchSize: 0 }, 500)).toBe(1);
  });
});

describe('parseMaxEpochsEnv', () => {
  it('sin valor o vacio usa 1000', () => {
    expect(parseMaxEpochsEnv(undefined)).toBe(1000);
    expect(parseMaxEpochsEnv(null)).toBe(1000);
    expect(parseMaxEpochsEnv('')).toBe(1000);
    expect(parseMaxEpochsEnv('   ')).toBe(1000);
  });

  it('acepta enteros positivos', () => {
    expect(parseMaxEpochsEnv('2500')).toBe(2500);
    expect(parseMaxEpochsEnv(' 42 ')).toBe(42);
  });

  it('valores invalidos usan 1000 con aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseMaxEpochsEnv('0')).toBe(1000);
    expect(parseMaxEpochsEnv('-1')).toBe(1000);
    expect(parseMaxEpochsEnv('3.5')).toBe(1000);
    expect(parseMaxEpochsEnv('abc')).toBe(1000);
    warn.mockRestore();
  });
});

describe('parseLossEnv', () => {
  it('sin valor usa MSE', () => {
    expect(parseLossEnv(undefined)).toBe('meanSquaredError');
    expect(parseLossEnv(null)).toBe('meanSquaredError');
    expect(parseLossEnv('')).toBe('meanSquaredError');
    expect(parseLossEnv('MSE')).toBe('meanSquaredError');
  });

  it('habilita BCE cuando se solicita', () => {
    expect(parseLossEnv('binaryCrossentropy')).toBe('binaryCrossentropy');
    expect(parseLossEnv(' BCE ')).toBe('binaryCrossentropy');
  });

  it('un valor invalido vuelve a MSE con aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseLossEnv('mae')).toBe('meanSquaredError');
    warn.mockRestore();
  });
});

describe('parseLearningRateEnv', () => {
  it('sin valor usa 0.05', () => {
    expect(parseLearningRateEnv(undefined)).toBe(0.05);
    expect(parseLearningRateEnv(null)).toBe(0.05);
    expect(parseLearningRateEnv('')).toBe(0.05);
  });

  it('acepta numeros positivos, incluida notacion cientifica', () => {
    expect(parseLearningRateEnv('0.1')).toBe(0.1);
    expect(parseLearningRateEnv('1e-3')).toBe(0.001);
  });

  it('un valor invalido vuelve a 0.05 con aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseLearningRateEnv('0')).toBe(0.05);
    expect(parseLearningRateEnv('-0.1')).toBe(0.05);
    expect(parseLearningRateEnv('Infinity')).toBe(0.05);
    expect(parseLearningRateEnv('abc')).toBe(0.05);
    warn.mockRestore();
  });
});
