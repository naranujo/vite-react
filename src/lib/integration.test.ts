import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseDataset } from './dataset';
import {
  buildFeatureMatrix,
  buildBinaryLabels,
} from './featureEngineering';
import { fitScaler, transformMatrix } from './preprocessing';
import { buildModel, compileModel, predictProbabilities } from './tensorflow';
import { computeMetrics } from './metrics';
import type { ResolvedArchitecture } from '../types/model';
import { tf } from './tensorflow';

/**
 * Prueba de integracion sobre el dataset real (public/data.csv):
 * parse -> features -> preprocesamiento -> modelo -> fit -> metricas.
 * Verifica que el pipeline completo produzca valores finitos y aprenda.
 */
describe('pipeline end-to-end con data.csv real', () => {
  it('entrena y produce metricas finitas sin fugas', async () => {
    const csv = readFileSync(
      resolve(process.cwd(), 'public/data.csv'),
      'utf-8',
    );
    const ds = parseDataset(csv);
    expect(ds.count).toBeGreaterThan(0);

    const selected = ['x', 'y', 'x2', 'y2'];
    const raw = buildFeatureMatrix(ds.rows, selected);
    const scaler = fitScaler(raw, 'standardize');
    const features = transformMatrix(raw, scaler);
    const labels = buildBinaryLabels(ds.rows);

    const arch: ResolvedArchitecture = {
      inputSize: features[0].length,
      hiddenLayers: [
        { units: 8, activation: 'tanh' },
        { units: 4, activation: 'relu' },
      ],
      outputActivation: 'sigmoid',
    };

    const tensorsBefore = tf.memory().numTensors;

    const model = buildModel(arch);
    const optimizer = compileModel(model);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels.map((v) => [v]));

    const first = await model.fit(xs, ys, { epochs: 1, batchSize: 32, verbose: 0 });
    const firstLoss = Number(first.history.loss?.[0]);

    const last = await model.fit(xs, ys, { epochs: 60, batchSize: 32, verbose: 0 });
    const lastLoss = Number(
      last.history.loss?.[last.history.loss.length - 1],
    );

    expect(Number.isFinite(firstLoss)).toBe(true);
    expect(Number.isFinite(lastLoss)).toBe(true);
    // El loss debe descender tras entrenar.
    expect(lastLoss).toBeLessThan(firstLoss);

    const probs = await predictProbabilities(model, features);
    const metrics = computeMetrics(labels, probs, 26, lastLoss);
    expect(metrics.accuracy).toBeGreaterThan(0.5);
    expect(Number.isFinite(metrics.precision)).toBe(true);
    expect(Number.isFinite(metrics.recall)).toBe(true);

    // Liberar memoria explicitamente.
    xs.dispose();
    ys.dispose();
    model.dispose();
    optimizer.dispose();

    const tensorsAfter = tf.memory().numTensors;
    expect(tensorsAfter).toBeLessThanOrEqual(tensorsBefore);
  }, 30000);
});
