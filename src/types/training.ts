/** Tipos relacionados con el estado y los resultados del entrenamiento. */

export type TrainingStatus =
  | 'idle' // sin entrenar todavia
  | 'training' // entrenando el modelo final
  | 'paused' // pausado
  | 'validating' // ejecutando cross-validation
  | 'stopped' // detenido por el alumno (conserva resultados)
  | 'finished' // termino por alcanzar max epochs
  | 'error'; // error durante el entrenamiento

/** Un punto de la curva de perdida. */
export interface LossPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

/** Matriz de confusion (etiquetas internas 0 = clase negativa, 1 = clase positiva). */
export interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

/** Metricas calculadas localmente sobre un conjunto. */
export interface Metrics {
  epochsRun: number;
  loss: number;
  accuracy: number;
  precision: number;
  recall: number;
  confusion: ConfusionMatrix;
}

/** Metricas agregadas de k-fold cross-validation (media y desvio por metrica). */
export interface CrossValMetrics {
  folds: number;
  accuracyMean: number;
  accuracyStd: number;
  precisionMean: number;
  precisionStd: number;
  recallMean: number;
  recallStd: number;
  lossMean: number;
  lossStd: number;
}

/** Progreso de la cross-validation. */
export interface CvProgress {
  fold: number;
  total: number;
}
