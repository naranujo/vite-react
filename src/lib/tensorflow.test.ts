import { describe, it, expect } from 'vitest';
import { buildModel, compileModel, liveTensorCount } from './tensorflow';
import type { ResolvedArchitecture } from '../types/model';

describe('construccion del modelo TensorFlow.js', () => {
  it('construye la cantidad correcta de capas y respeta el input', () => {
    const arch: ResolvedArchitecture = {
      inputSize: 4,
      hiddenLayers: [
        { units: 8, activation: 'tanh' },
        { units: 4, activation: 'relu' },
      ],
      outputActivation: 'sigmoid',
    };
    const model = buildModel(arch);
    // 2 ocultas + 1 salida
    expect(model.layers.length).toBe(3);
    // input shape [null, 4]
    const inputShape = model.inputs[0].shape;
    expect(inputShape[inputShape.length - 1]).toBe(4);
    // salida Dense(1)
    const outShape = model.outputs[0].shape;
    expect(outShape[outShape.length - 1]).toBe(1);
    model.dispose();
  });

  it('compila y libera memoria correctamente con dispose', () => {
    const arch: ResolvedArchitecture = {
      inputSize: 2,
      hiddenLayers: [{ units: 4, activation: 'relu' }],
      outputActivation: 'sigmoid',
    };
    // Calentamos el backend: la primera inicializacion reserva tensores
    // persistentes propios de TensorFlow.js, ajenos a nuestro modelo.
    const warmup = buildModel(arch);
    warmup.dispose();

    // Ahora medimos solo el impacto de construir y liberar un modelo,
    // repetido varias veces para detectar fugas por ciclo.
    const before = liveTensorCount();
    for (let i = 0; i < 5; i++) {
      const model = buildModel(arch);
      const optimizer = compileModel(model);
      model.dispose();
      optimizer.dispose();
    }
    const after = liveTensorCount();

    // No deberian quedar tensores residuales tras liberar modelo + optimizador.
    expect(after).toBeLessThanOrEqual(before);
  });
});
