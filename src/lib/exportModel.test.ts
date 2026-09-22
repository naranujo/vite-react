import { describe, it, expect } from 'vitest';
import { buildModel } from './tensorflow';
import { extractModelParameters } from './exportModel';
import type { ResolvedArchitecture } from '../types/model';

describe('extractModelParameters', () => {
  it('exporta pesos y sesgos con las dimensiones correctas por capa', async () => {
    const arch: ResolvedArchitecture = {
      inputSize: 3,
      hiddenLayers: [
        { units: 5, activation: 'tanh' },
        { units: 2, activation: 'relu' },
      ],
      outputActivation: 'sigmoid',
    };
    const model = buildModel(arch);
    const params = await extractModelParameters(model, ['x', 'y', 'x2']);

    // 2 ocultas + 1 salida
    expect(params.layers.length).toBe(3);
    expect(params.inputSize).toBe(3);
    expect(params.inputFeatures).toEqual(['x', 'y', 'x2']);
    expect(params.outputActivation).toBe('sigmoid');

    const [h1, h2, out] = params.layers;

    // Capa 1: kernel [3][5], bias [5]
    expect(h1.role).toBe('hidden');
    expect(h1.activation).toBe('tanh');
    expect(h1.weights.length).toBe(3);
    expect(h1.weights[0].length).toBe(5);
    expect(h1.biases.length).toBe(5);

    // Capa 2: kernel [5][2], bias [2]
    expect(h2.weights.length).toBe(5);
    expect(h2.weights[0].length).toBe(2);
    expect(h2.biases.length).toBe(2);

    // Salida: kernel [2][1], bias [1]
    expect(out.role).toBe('output');
    expect(out.activation).toBe('sigmoid');
    expect(out.weights.length).toBe(2);
    expect(out.weights[0].length).toBe(1);
    expect(out.biases.length).toBe(1);

    model.dispose();
  });
});
