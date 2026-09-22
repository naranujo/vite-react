/**
 * Configuracion docente de ENTRENAMIENTO, CROSS-VALIDATION y PREPROCESAMIENTO.
 *
 * TODOS los hiperparametros los controla el docente desde este archivo.
 * El alumno NO puede modificarlos desde la interfaz.
 */

export type OptimizerName = 'sgd' | 'adam' | 'rmsprop';
export type LossName = 'meanSquaredError' | 'binaryCrossentropy';
export type PreprocessingMode = 'none' | 'normalize' | 'standardize';

/**
 * Tamano de batch. El valor `'full'` usa TODO el conjunto en cada paso
 * (batch gradient descent): el batch size efectivo es la cantidad de registros.
 */
export type BatchSize = number | 'full';

export interface CrossValidationConfig {
  /** Si se ejecuta cross-validation ademas del entrenamiento final. */
  enabled: boolean;
  /** Cantidad de folds (k). */
  folds: number;
  /** Si se mezclan los indices antes de particionar. */
  shuffle: boolean;
  /** Semilla para una mezcla reproducible. */
  seed: number;
}

export interface TrainingConfig {
  /** Optimizador usado para compilar el modelo. */
  optimizer: OptimizerName;
  /** Learning rate del optimizador. */
  learningRate: number;
  /** Momentum del SGD (0.0 = SGD clasico sin momentum). */
  momentum: number;
  /** Funcion de perdida. Debe ser coherente con la salida sigmoid binaria. */
  loss: LossName;
  /**
   * Tamano de batch. `'full'` = batch gradient descent (todos los registros por
   * paso), tal como se pide para este trabajo.
   */
  batchSize: BatchSize;
  /** Maximo de epochs. El entrenamiento se detiene al alcanzarlo. */
  maxEpochs: number;
  /**
   * Preprocesamiento aplicado a las features antes de entrenar:
   *  - 'none'        : sin transformacion.
   *  - 'normalize'   : escalado min-max al rango [0, 1] por columna.
   *  - 'standardize' : media 0 y desvio 1 por columna (z-score).
   *
   * El escalado se aprende sobre el conjunto de entrenamiento y se reaplica de
   * forma consistente al grid usado para la frontera de decision.
   */
  preprocessing: PreprocessingMode;
  /** Configuracion de cross-validation. */
  crossValidation: CrossValidationConfig;
}

/**
 * Interpreta el valor de la variable de entorno `VITE_BATCH_SIZE`.
 *
 * - vacia / ausente / 'full' -> 'full' (batch gradient descent).
 * - entero positivo         -> ese tamano de batch (mini-batch).
 * - cualquier otra cosa      -> 'full' (con aviso en consola).
 *
 * Funcion pura para poder testearla sin depender de import.meta.env.
 */
export function parseBatchSizeEnv(raw: string | undefined | null): BatchSize {
  if (raw === undefined || raw === null) return 'full';
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'full') return 'full';
  const n = Number(trimmed);
  if (Number.isInteger(n) && n > 0) return n;
  console.warn(
    `VITE_BATCH_SIZE invalido: "${raw}". Se usa batch = 'full' (todos los registros).`,
  );
  return 'full';
}

/** Lee el batch size configurado por entorno (Vite lo inyecta en build). */
function batchSizeFromEnv(): BatchSize {
  const raw = import.meta.env?.VITE_BATCH_SIZE as string | undefined;
  return parseBatchSizeEnv(raw);
}

/**
 * Interpreta el maximo de epocas configurado por `VITE_MAX_EPOCHS`.
 * Solo se aceptan enteros positivos; una configuracion ausente o invalida usa
 * el valor docente por defecto de 1000.
 */
export function parseMaxEpochsEnv(raw: string | undefined | null): number {
  const fallback = 1000;
  if (raw === undefined || raw === null || raw.trim() === '') return fallback;
  const epochs = Number(raw.trim());
  if (Number.isInteger(epochs) && epochs > 0) return epochs;
  console.warn(
    `VITE_MAX_EPOCHS invalido: "${raw}". Se usan ${fallback} epocas.`,
  );
  return fallback;
}

/** Lee el maximo de epocas configurado por entorno (Vite lo inyecta en build). */
function maxEpochsFromEnv(): number {
  const raw = import.meta.env?.VITE_MAX_EPOCHS as string | undefined;
  return parseMaxEpochsEnv(raw);
}

/**
 * Interpreta la funcion de perdida configurada por `VITE_LOSS`.
 * MSE es el valor por defecto; BCE debe solicitarse explicitamente.
 */
export function parseLossEnv(raw: string | undefined | null): LossName {
  const fallback: LossName = 'meanSquaredError';
  if (raw === undefined || raw === null || raw.trim() === '') return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'meansquarederror' || normalized === 'mse') return fallback;
  if (normalized === 'binarycrossentropy' || normalized === 'bce') {
    return 'binaryCrossentropy';
  }
  console.warn(
    `VITE_LOSS invalido: "${raw}". Se usa ${fallback} (MSE).`,
  );
  return fallback;
}

/** Lee la loss configurada por entorno (Vite la inyecta en build). */
function lossFromEnv(): LossName {
  const raw = import.meta.env?.VITE_LOSS as string | undefined;
  return parseLossEnv(raw);
}

/**
 * Interpreta el learning rate configurado por `VITE_LEARNING_RATE`.
 * Solo se aceptan numeros finitos mayores a cero; si falta o es invalido se
 * conserva el valor docente por defecto de 0.05.
 */
export function parseLearningRateEnv(raw: string | undefined | null): number {
  const fallback = 0.05;
  if (raw === undefined || raw === null || raw.trim() === '') return fallback;
  const learningRate = Number(raw.trim());
  if (Number.isFinite(learningRate) && learningRate > 0) return learningRate;
  console.warn(
    `VITE_LEARNING_RATE invalido: "${raw}". Se usa ${fallback}.`,
  );
  return fallback;
}

/** Lee el learning rate configurado por entorno (Vite lo inyecta en build). */
function learningRateFromEnv(): number {
  const raw = import.meta.env?.VITE_LEARNING_RATE as string | undefined;
  return parseLearningRateEnv(raw);
}

/**
 * Configuracion inicial.
 *
 * - SGD con learning rate 0.05 y momentum 0.0 (SGD clasico).
 * - Batch: por defecto 'full' (batch gradient descent: el batch es la cantidad
 *   de registros). Se puede sobrescribir con la variable de entorno
 *   `VITE_BATCH_SIZE` (por ejemplo 32) sin tocar codigo.
 * - El conjunto de entrenamiento del modelo final es SIEMPRE el total de los
 *   datos; la generalizacion se estima con k-fold cross-validation.
 *
 * - Maximo de epocas: `VITE_MAX_EPOCHS` si contiene un entero positivo; de lo
 *   contrario, 1000.
 * - Loss: MSE por defecto; `VITE_LOSS=binaryCrossentropy` habilita BCE.
 * - Learning rate: `VITE_LEARNING_RATE` si es un numero positivo; si no, 0.05.
 *
 * El calculo interno del entrenamiento SIEMPRE usa etiquetas {0, 1},
 * independientemente de la representacion elegida por el alumno para
 * visualizar el target.
 */
export const TRAINING_CONFIG: TrainingConfig = {
  optimizer: 'sgd',
  learningRate: learningRateFromEnv(),
  momentum: 0.0,
  loss: lossFromEnv(),
  batchSize: batchSizeFromEnv(),
  maxEpochs: maxEpochsFromEnv(),
  preprocessing: 'standardize',
  crossValidation: {
    enabled: true,
    folds: 5,
    shuffle: true,
    seed: 42,
  },
};

/** Resuelve el batch size efectivo dado el tamano del conjunto. */
export function resolveBatchSize(config: TrainingConfig, sampleCount: number): number {
  if (config.batchSize === 'full') return Math.max(1, sampleCount);
  return Math.max(1, Math.min(config.batchSize, sampleCount));
}

/** Metricas finales que se calculan y muestran al alumno. */
export const REPORTED_METRICS = [
  'epochs',
  'loss',
  'accuracy',
  'precision',
  'recall',
] as const;
