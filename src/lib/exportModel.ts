import type * as tfType from '@tensorflow/tfjs';
import { TRAINING_CONFIG } from '../config/training';

/**
 * Exportacion de pesos y sesgos por capa del modelo entrenado.
 *
 * Todo ocurre en el navegador: se leen los tensores del modelo y se arma un
 * objeto serializable. No se envia nada a ningun servidor.
 */

export interface LayerParameters {
  /** Indice de la capa (0 = primera oculta). */
  index: number;
  /** Nombre interno de la capa en TensorFlow.js. */
  name: string;
  /** 'hidden' u 'output'. */
  role: 'hidden' | 'output';
  /** Cantidad de neuronas (unidades) de la capa. */
  units: number;
  /** Funcion de activacion de la capa. */
  activation: string;
  /**
   * Matriz de pesos con forma [inputs_de_la_capa][units].
   * weights[i][j] = peso de la entrada i hacia la neurona j.
   */
  weights: number[][];
  /** Vector de sesgos, uno por neurona (largo = units). */
  biases: number[];
}

export interface ModelParametersExport {
  createdAt: string;
  inputSize: number;
  inputFeatures: string[];
  optimizer: string;
  learningRate: number;
  momentum: number;
  loss: string;
  outputActivation: string;
  layers: LayerParameters[];
}

interface DenseConfig {
  units?: number;
  activation?: string;
}

/**
 * Extrae pesos y sesgos de cada capa densa del modelo entrenado.
 *
 * Toda la metadata (inputSize, units, activaciones) se deriva del modelo real,
 * no de la configuracion actual de la UI (que el alumno podria haber cambiado
 * despues de entrenar). No libera los tensores devueltos por getWeights porque
 * son variables del propio modelo.
 */
export async function extractModelParameters(
  model: tfType.LayersModel,
  inputFeatures: string[],
): Promise<ModelParametersExport> {
  const layers: LayerParameters[] = [];
  const lastIndex = model.layers.length - 1;

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];
    const w = layer.getWeights(); // [kernel, bias]
    if (w.length < 2) continue;
    const kernel = (await w[0].array()) as number[][];
    const bias = (await w[1].array()) as number[];
    const cfg = layer.getConfig() as DenseConfig;

    layers.push({
      index: i,
      name: layer.name,
      role: i === lastIndex ? 'output' : 'hidden',
      units: cfg.units ?? bias.length,
      activation: cfg.activation ?? 'unknown',
      weights: kernel,
      biases: bias,
    });
  }

  // inputSize = filas del kernel de la primera capa; salida = ultima capa.
  const inputSize = layers[0]?.weights.length ?? inputFeatures.length;
  const outputActivation = layers[lastIndex]?.activation ?? 'unknown';

  return {
    createdAt: new Date().toISOString(),
    inputSize,
    inputFeatures,
    optimizer: TRAINING_CONFIG.optimizer,
    learningRate: TRAINING_CONFIG.learningRate,
    momentum: TRAINING_CONFIG.momentum,
    loss: TRAINING_CONFIG.loss,
    outputActivation,
    layers,
  };
}
