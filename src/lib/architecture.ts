import type {
  Architecture,
  HiddenLayerConfig,
  ResolvedArchitecture,
} from '../types/model';
import { PLAYGROUND_CONFIG } from '../config/playground';

/** Utilidades de validacion / normalizacion de la arquitectura. */

export function clampUnits(units: number): number {
  const { minNeuronsPerLayer, maxNeuronsPerLayer } = PLAYGROUND_CONFIG;
  if (Number.isNaN(units)) return minNeuronsPerLayer;
  return Math.max(minNeuronsPerLayer, Math.min(maxNeuronsPerLayer, Math.round(units)));
}

export function canAddLayer(layers: HiddenLayerConfig[]): boolean {
  return layers.length < PLAYGROUND_CONFIG.maxHiddenLayers;
}

export function canRemoveLayer(layers: HiddenLayerConfig[]): boolean {
  return layers.length > PLAYGROUND_CONFIG.minHiddenLayers;
}

export interface ArchValidation {
  valid: boolean;
  errors: string[];
}

export function validateArchitecture(arch: Architecture): ArchValidation {
  const errors: string[] = [];
  const {
    minHiddenLayers,
    maxHiddenLayers,
    minNeuronsPerLayer,
    maxNeuronsPerLayer,
    allowedHiddenActivations,
    allowedOutputActivations,
  } = PLAYGROUND_CONFIG;

  if (arch.inputSize < 1) {
    errors.push('Debe haber al menos una feature seleccionada.');
  }
  if (arch.hiddenLayers.length < minHiddenLayers) {
    errors.push(
      `Agregue al menos ${minHiddenLayers} capa(s) oculta(s) y complete sus valores.`,
    );
  }
  if (arch.hiddenLayers.length > maxHiddenLayers) {
    errors.push(`Se permite un maximo de ${maxHiddenLayers} capa(s) oculta(s).`);
  }
  arch.hiddenLayers.forEach((layer, i) => {
    if (layer.units === null) {
      errors.push(`Capa oculta ${i + 1}: falta definir la cantidad de neuronas.`);
    } else if (
      layer.units < minNeuronsPerLayer ||
      layer.units > maxNeuronsPerLayer
    ) {
      errors.push(
        `Capa oculta ${i + 1}: las neuronas deben estar entre ${minNeuronsPerLayer} y ${maxNeuronsPerLayer}.`,
      );
    }
    if (layer.activation === null) {
      errors.push(`Capa oculta ${i + 1}: falta elegir la activacion.`);
    } else if (!allowedHiddenActivations.includes(layer.activation)) {
      errors.push(`Capa oculta ${i + 1}: activacion no permitida.`);
    }
  });
  if (arch.outputActivation === null) {
    errors.push('Falta elegir la activacion de la capa de salida.');
  } else if (!allowedOutputActivations.includes(arch.outputActivation)) {
    errors.push('Activacion de salida no permitida.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Convierte una Architecture validada en ResolvedArchitecture (sin nulls).
 * Lanza si algun valor sigue sin setear (proteccion en tiempo de ejecucion).
 */
export function resolveArchitecture(arch: Architecture): ResolvedArchitecture {
  const hiddenLayers = arch.hiddenLayers.map((l, i) => {
    if (l.units === null || l.activation === null) {
      throw new Error(`Capa oculta ${i + 1} incompleta.`);
    }
    return { units: l.units, activation: l.activation };
  });
  if (arch.outputActivation === null) {
    throw new Error('Activacion de salida sin definir.');
  }
  return {
    inputSize: arch.inputSize,
    hiddenLayers,
    outputActivation: arch.outputActivation,
  };
}
