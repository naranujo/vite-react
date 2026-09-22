import type { ActivationName } from '../config/playground';

/**
 * Definicion de una capa oculta editable por el alumno.
 *
 * Los valores pueden estar SIN SETEAR (`null`): no hay valores predeterminados,
 * el alumno debe elegir explicitamente neuronas y activacion.
 */
export interface HiddenLayerConfig {
  units: number | null;
  activation: ActivationName | null;
}

/**
 * Arquitectura definida por el alumno.
 *
 * `outputActivation` tambien puede estar sin setear (`null`): la salida es
 * siempre Dense(1) pero el alumno debe elegir su activacion.
 */
export interface Architecture {
  /** Numero de inputs. Se determina automaticamente segun las features. */
  inputSize: number;
  hiddenLayers: HiddenLayerConfig[];
  outputActivation: ActivationName | null;
}

/**
 * Arquitectura ya validada: todos los valores estan seteados. Se usa para
 * construir el modelo de TensorFlow.js.
 */
export interface ResolvedArchitecture {
  inputSize: number;
  hiddenLayers: { units: number; activation: ActivationName }[];
  outputActivation: ActivationName;
}
