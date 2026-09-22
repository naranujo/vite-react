import { describe, it, expect } from 'vitest';
import {
  clampUnits,
  canAddLayer,
  canRemoveLayer,
  validateArchitecture,
} from './architecture';
import { PLAYGROUND_CONFIG } from '../config/playground';
import type { Architecture } from '../types/model';

describe('architecture', () => {
  it('clampUnits respeta limites', () => {
    expect(clampUnits(0)).toBe(PLAYGROUND_CONFIG.minNeuronsPerLayer);
    expect(clampUnits(1000)).toBe(PLAYGROUND_CONFIG.maxNeuronsPerLayer);
    expect(clampUnits(5.6)).toBe(6);
  });

  it('canAddLayer / canRemoveLayer respetan limites', () => {
    const min = Array.from({ length: PLAYGROUND_CONFIG.minHiddenLayers }, () => ({
      units: 4,
      activation: 'relu' as const,
    }));
    const max = Array.from({ length: PLAYGROUND_CONFIG.maxHiddenLayers }, () => ({
      units: 4,
      activation: 'relu' as const,
    }));
    expect(canRemoveLayer(min)).toBe(false);
    expect(canAddLayer(max)).toBe(false);
    expect(canAddLayer(min)).toBe(true);
  });

  it('valida una arquitectura correcta', () => {
    const arch: Architecture = {
      inputSize: 2,
      hiddenLayers: [{ units: 8, activation: 'tanh' }],
      outputActivation: 'sigmoid',
    };
    expect(validateArchitecture(arch).valid).toBe(true);
  });

  it('detecta input invalido', () => {
    const arch: Architecture = {
      inputSize: 0,
      hiddenLayers: [{ units: 8, activation: 'tanh' }],
      outputActivation: 'sigmoid',
    };
    const v = validateArchitecture(arch);
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it('detecta demasiadas capas', () => {
    const arch: Architecture = {
      inputSize: 2,
      hiddenLayers: Array.from(
        { length: PLAYGROUND_CONFIG.maxHiddenLayers + 1 },
        () => ({ units: 4, activation: 'relu' as const }),
      ),
      outputActivation: 'sigmoid',
    };
    expect(validateArchitecture(arch).valid).toBe(false);
  });
});
