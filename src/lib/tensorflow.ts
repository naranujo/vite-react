import * as tf from '@tensorflow/tfjs';
import type { ResolvedArchitecture } from '../types/model';
import {
  TRAINING_CONFIG,
  type OptimizerName,
  type LossName,
} from '../config/training';

/**
 * Construccion y compilacion del modelo TensorFlow.js a partir de la
 * arquitectura definida por el alumno + configuracion docente.
 *
 * Manejo de memoria: el llamador es responsable de invocar `model.dispose()`
 * cuando el modelo ya no se usa (ver useTraining / experimentStore).
 */

function createOptimizer(
  name: OptimizerName,
  lr: number,
  momentum: number,
): tf.Optimizer {
  switch (name) {
    case 'adam':
      return tf.train.adam(lr);
    case 'rmsprop':
      return tf.train.rmsprop(lr);
    case 'sgd':
    default:
      // SGD con momentum: momentum 0.0 equivale al SGD clasico.
      return momentum > 0 ? tf.train.momentum(lr, momentum) : tf.train.sgd(lr);
  }
}

function tfLoss(name: LossName): string {
  return name;
}

/** Construye el modelo secuencial. La salida es siempre Dense(1). */
export function buildModel(arch: ResolvedArchitecture): tf.Sequential {
  const model = tf.sequential();

  arch.hiddenLayers.forEach((layer, idx) => {
    model.add(
      tf.layers.dense({
        units: layer.units,
        activation: layer.activation,
        inputShape: idx === 0 ? [arch.inputSize] : undefined,
        kernelInitializer: 'glorotUniform',
      }),
    );
  });

  model.add(
    tf.layers.dense({
      units: 1,
      activation: arch.outputActivation,
      kernelInitializer: 'glorotUniform',
    }),
  );

  return model;
}

/**
 * Compila el modelo usando exclusivamente la configuracion docente.
 *
 * Devuelve el optimizador creado: `model.dispose()` NO libera el optimizador,
 * asi que el llamador debe conservar esta referencia y llamar a
 * `optimizer.dispose()` para evitar una fuga de un tensor por cada modelo.
 */
export function compileModel(model: tf.Sequential): tf.Optimizer {
  const optimizer = createOptimizer(
    TRAINING_CONFIG.optimizer,
    TRAINING_CONFIG.learningRate,
    TRAINING_CONFIG.momentum,
  );
  model.compile({
    optimizer,
    loss: tfLoss(TRAINING_CONFIG.loss),
    metrics: ['accuracy'],
  });
  return optimizer;
}

/**
 * Predice probabilidades para una matriz de features. Devuelve un array plano.
 * Usa tf.tidy para liberar tensores intermedios; solo el resultado numerico
 * (ya fuera de tensores) sobrevive.
 */
export async function predictProbabilities(
  model: tf.LayersModel,
  features: number[][],
): Promise<number[]> {
  const outputTensor = tf.tidy(() => {
    const input = tf.tensor2d(features);
    return model.predict(input) as tf.Tensor;
  });
  const data = await outputTensor.data();
  outputTensor.dispose();
  return Array.from(data);
}

/** Numero de tensores actualmente vivos (util para diagnostico de fugas). */
export function liveTensorCount(): number {
  return tf.memory().numTensors;
}

export { tf };
