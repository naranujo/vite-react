import * as tf from '@tensorflow/tfjs';
import type { ResolvedArchitecture } from '../types/model';
import type {
  LossPoint,
  Metrics,
  CrossValMetrics,
} from '../types/training';
import { buildModel, compileModel, predictProbabilities } from './tensorflow';
import { TRAINING_CONFIG, resolveBatchSize } from '../config/training';
import { computeMetrics, computeLoss } from './metrics';
import { kFold, aggregateCvMetrics } from './crossValidation';

/**
 * Motor de entrenamiento.
 *
 * Flujo:
 *  1. Entrena el MODELO FINAL con el total de los datos (batch gradient descent
 *     si batchSize = 'full'), epoch por epoch, para:
 *       - actualizar el grafico de loss en tiempo real,
 *       - permitir pausar / reanudar / detener sin bloquear la UI.
 *  2. Ejecuta k-fold CROSS-VALIDATION para estimar la generalizacion (media y
 *     desvio de accuracy/precision/recall/loss).
 *
 * El modelo final se conserva (para frontera y matriz de confusion) hasta
 * reset/rebuild. Se cuida la memoria: cada modelo de fold y el optimizador se
 * liberan (model.dispose no libera el optimizador).
 */

export interface TrainingData {
  /** Matriz de features ya preprocesada [n][d]. */
  features: number[][];
  /** Etiquetas internas {0,1}. */
  labels: number[];
}

export interface TrainingCallbacks {
  onEpoch: (point: LossPoint) => void;
  onPhase: (phase: 'training' | 'validating') => void;
  onCvProgress: (done: number, total: number) => void;
  onFinish: (
    finalMetrics: Metrics,
    cvMetrics: CrossValMetrics | null,
    status: 'stopped' | 'finished',
  ) => void;
  onError: (message: string) => void;
}

/** Epochs por llamada a fit durante la cross-validation (para ceder el hilo). */
const CV_CHUNK_EPOCHS = 50;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function subset<T>(arr: T[], indices: number[]): T[] {
  return indices.map((i) => arr[i]);
}

export class TrainingEngine {
  private model: tf.Sequential | null = null;
  private optimizer: tf.Optimizer | null = null;
  private running = false;
  private paused = false;
  private shouldStop = false;

  isRunning(): boolean {
    return this.running;
  }

  getModel(): tf.Sequential | null {
    return this.model;
  }

  pause(): void {
    if (this.running) this.paused = true;
  }

  resume(): void {
    if (this.running) this.paused = false;
  }

  stop(): void {
    if (this.running) {
      this.shouldStop = true;
      this.paused = false;
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Libera el modelo final, su optimizador y resetea flags. */
  dispose(): void {
    this.shouldStop = true;
    this.paused = false;
    this.running = false;
    this.releaseModel();
  }

  private releaseModel(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    if (this.optimizer) {
      this.optimizer.dispose();
      this.optimizer = null;
    }
  }

  /**
   * Inicia el entrenamiento del modelo final + cross-validation.
   * No hace nada si ya hay un entrenamiento en curso.
   */
  async start(
    arch: ResolvedArchitecture,
    data: TrainingData,
    callbacks: TrainingCallbacks,
  ): Promise<void> {
    if (this.running) return;

    this.releaseModel();
    this.running = true;
    this.paused = false;
    this.shouldStop = false;

    let xs: tf.Tensor2D | null = null;
    let ys: tf.Tensor2D | null = null;

    try {
      // ---------- Fase 1: modelo final sobre TODOS los datos ----------
      callbacks.onPhase('training');
      this.model = buildModel(arch);
      this.optimizer = compileModel(this.model);

      xs = tf.tensor2d(data.features);
      ys = tf.tensor2d(data.labels.map((v) => [v]));

      const batchSize = resolveBatchSize(TRAINING_CONFIG, data.features.length);
      let lastLoss = Number.NaN;
      let epochsRun = 0;
      let reachedPerfectAccuracy = false;
      let stopAfterNextEpoch = false;

      for (let epoch = 1; epoch <= TRAINING_CONFIG.maxEpochs; epoch++) {
        if (this.shouldStop) break;
        while (this.paused && !this.shouldStop) {
          await sleep(100);
        }
        if (this.shouldStop) break;

        const history = await this.model.fit(xs, ys, {
          epochs: 1,
          batchSize,
          shuffle: true,
          verbose: 0,
        });

        const lossVal = history.history.loss?.[0];
        const accVal = history.history.acc?.[0] ?? history.history.accuracy?.[0];
        lastLoss = typeof lossVal === 'number' ? lossVal : Number(lossVal ?? NaN);
        const accuracy =
          typeof accVal === 'number' ? accVal : Number(accVal ?? NaN);
        epochsRun = epoch;

        callbacks.onEpoch({ epoch, loss: lastLoss, accuracy });

        // Si la epoca anterior alcanzo accuracy = 1.0, esta es la unica epoca
        // adicional solicitada: finalizamos ahora, sin ejecutar CV.
        if (stopAfterNextEpoch) {
          reachedPerfectAccuracy = true;
          break;
        }

        // Al alcanzar accuracy = 1.0, se permite exactamente una epoca mas.
        // (Con batch='full' la accuracy reportada es exacta sobre todo el
        // conjunto; con mini-batch, media 1.0 implica todos los batches
        // perfectos, es decir clasificacion perfecta.)
        if (Number.isFinite(accuracy) && accuracy >= 1) {
          stopAfterNextEpoch = true;
        }

        await nextFrame();
      }

      const status: 'stopped' | 'finished' = this.shouldStop
        ? 'stopped'
        : 'finished';

      const finalProbs = await predictProbabilities(this.model, data.features);
      const finalMetrics = computeMetrics(
        data.labels,
        finalProbs,
        epochsRun,
        lastLoss,
      );

      // Ya no necesitamos los tensores del conjunto completo.
      xs.dispose();
      ys.dispose();
      xs = null;
      ys = null;

      // ---------- Fase 2: k-fold cross-validation ----------
      let cvMetrics: CrossValMetrics | null = null;
      const cv = TRAINING_CONFIG.crossValidation;
      if (
        cv.enabled &&
        !this.shouldStop &&
        !reachedPerfectAccuracy &&
        !stopAfterNextEpoch
      ) {
        callbacks.onPhase('validating');
        cvMetrics = await this.runCrossValidation(arch, data, callbacks);
      }

      callbacks.onFinish(finalMetrics, cvMetrics, status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      callbacks.onError(msg);
    } finally {
      if (xs) xs.dispose();
      if (ys) ys.dispose();
      this.running = false;
      this.paused = false;
      this.shouldStop = false;
    }
  }

  /** Ejecuta k folds y devuelve las metricas agregadas (o null si se detuvo). */
  private async runCrossValidation(
    arch: ResolvedArchitecture,
    data: TrainingData,
    callbacks: TrainingCallbacks,
  ): Promise<CrossValMetrics | null> {
    const cv = TRAINING_CONFIG.crossValidation;
    const n = data.features.length;
    const folds = kFold(n, cv.folds, cv.shuffle, cv.seed);
    const perFold: Metrics[] = [];

    for (let f = 0; f < folds.length; f++) {
      if (this.shouldStop) break;
      const { trainIndices, valIndices } = folds[f];
      if (trainIndices.length === 0 || valIndices.length === 0) continue;

      const trainX = subset(data.features, trainIndices);
      const trainY = subset(data.labels, trainIndices);
      const valX = subset(data.features, valIndices);
      const valY = subset(data.labels, valIndices);

      const foldModel = buildModel(arch);
      const foldOptimizer = compileModel(foldModel);
      const fxs = tf.tensor2d(trainX);
      const fys = tf.tensor2d(trainY.map((v) => [v]));
      const batchSize = resolveBatchSize(TRAINING_CONFIG, trainX.length);

      try {
        let done = 0;
        while (done < TRAINING_CONFIG.maxEpochs && !this.shouldStop) {
          const chunk = Math.min(
            CV_CHUNK_EPOCHS,
            TRAINING_CONFIG.maxEpochs - done,
          );
          await foldModel.fit(fxs, fys, {
            epochs: chunk,
            batchSize,
            shuffle: true,
            verbose: 0,
          });
          done += chunk;
          await nextFrame();
        }

        const valProbs = await predictProbabilities(foldModel, valX);
        const valLoss = computeLoss(TRAINING_CONFIG.loss, valY, valProbs);
        perFold.push(computeMetrics(valY, valProbs, done, valLoss));
      } finally {
        fxs.dispose();
        fys.dispose();
        foldModel.dispose();
        foldOptimizer.dispose();
      }

      callbacks.onCvProgress(perFold.length, folds.length);
      await nextFrame();
    }

    return perFold.length > 0 ? aggregateCvMetrics(perFold) : null;
  }
}

/** Instancia unica por pestana del navegador. */
export const trainingEngine = new TrainingEngine();
