/**
 * Configuracion docente de LIMITES DE ARQUITECTURA.
 *
 * Modificar estos valores para cambiar los limites que el alumno puede usar
 * en el editor de arquitectura. No requiere tocar componentes de React.
 */

export type ActivationName = 'relu' | 'tanh' | 'sigmoid';

export interface PlaygroundConfig {
  /** Minimo y maximo de capas ocultas que el alumno puede definir. */
  minHiddenLayers: number;
  maxHiddenLayers: number;
  /** Minimo y maximo de neuronas por capa oculta. */
  minNeuronsPerLayer: number;
  maxNeuronsPerLayer: number;
  /** Activaciones permitidas para capas ocultas. */
  allowedHiddenActivations: ActivationName[];
  /** Activaciones permitidas para la capa de salida (el alumno elige). */
  allowedOutputActivations: ActivationName[];
}

/**
 * IMPORTANTE: no hay arquitectura por defecto. El alumno debe definir las capas
 * ocultas y elegir cada valor (neuronas y activacion) sin valores
 * predeterminados, asi como la activacion de la capa de salida.
 */
export const PLAYGROUND_CONFIG: PlaygroundConfig = {
  minHiddenLayers: 1,
  maxHiddenLayers: 3,
  minNeuronsPerLayer: 1,
  maxNeuronsPerLayer: 32,
  allowedHiddenActivations: ['relu', 'tanh', 'sigmoid'],
  allowedOutputActivations: ['sigmoid', 'tanh'],
};
