import { create } from 'zustand';
import type { Dataset, TargetRepresentation } from '../types/dataset';
import type { HiddenLayerConfig, Architecture } from '../types/model';
import type {
  LossPoint,
  Metrics,
  TrainingStatus,
  CrossValMetrics,
  CvProgress,
} from '../types/training';
import type { ActivationName } from '../config/playground';
import { TRAINING_CONFIG } from '../config/training';
import { DEFAULT_FEATURE_IDS, MIN_SELECTED_FEATURES } from '../config/features';
import { loadDataset, DatasetError } from '../lib/dataset';
import {
  buildFeatureMatrix,
  buildBinaryLabels,
  inputSizeFor,
} from '../lib/featureEngineering';
import { fitScaler, transformMatrix, type Scaler } from '../lib/preprocessing';
import { trainingEngine } from '../lib/trainingEngine';
import {
  extractModelParameters,
  type ModelParametersExport,
} from '../lib/exportModel';
import {
  computeDecisionBoundary,
  type DecisionBoundaryData,
} from '../lib/decisionBoundary';
import {
  clampUnits,
  canAddLayer,
  canRemoveLayer,
  validateArchitecture,
  resolveArchitecture,
} from '../lib/architecture';

export type AppStatus =
  | 'initializing'
  | 'loading_dataset'
  | 'dataset_ready'
  | 'dataset_error';

/** Snapshot no reactivo del contexto usado en el ultimo entrenamiento. */
let currentScaler: Scaler | null = null;
let trainedFeatureIds: string[] = [];

const BOUNDARY_RESOLUTION = 60;

/** Sin arquitectura por defecto: el alumno agrega y completa las capas. */
function initialHiddenLayers(): HiddenLayerConfig[] {
  return [];
}

/** Nueva capa sin valores predeterminados. */
function emptyHiddenLayer(): HiddenLayerConfig {
  return { units: null, activation: null };
}

interface ExperimentState {
  // --- App / dataset ---
  appStatus: AppStatus;
  datasetError: string | null;
  dataset: Dataset | null;

  // --- Configuracion del experimento ---
  targetRepresentation: TargetRepresentation;
  selectedFeatureIds: string[];
  hiddenLayers: HiddenLayerConfig[];
  outputActivation: ActivationName | null;

  // --- Entrenamiento ---
  trainingStatus: TrainingStatus;
  trainingError: string | null;
  lossHistory: LossPoint[];
  currentEpoch: number;
  currentLoss: number;
  currentAccuracy: number;
  metrics: Metrics | null;
  cvMetrics: CrossValMetrics | null;
  cvProgress: CvProgress | null;

  // --- Frontera de decision ---
  boundary: DecisionBoundaryData | null;
  boundaryLoading: boolean;

  // --- Acciones ---
  init: () => Promise<void>;
  setTargetRepresentation: (rep: TargetRepresentation) => void;
  toggleFeature: (id: string) => void;
  addHiddenLayer: () => void;
  removeHiddenLayer: (index: number) => void;
  setLayerUnits: (index: number, units: number | null) => void;
  setLayerActivation: (index: number, activation: ActivationName) => void;
  setOutputActivation: (activation: ActivationName) => void;
  startTraining: () => Promise<void>;
  pauseTraining: () => void;
  resumeTraining: () => void;
  stopTraining: () => void;
  resetExperiment: () => void;
  getArchitecture: () => Architecture;
  isLocked: () => boolean;
  /** true si hay un modelo entrenado cuyos parametros se pueden consultar. */
  canExport: () => boolean;
  /** Devuelve pesos y sesgos por capa del modelo entrenado para mostrarlos localmente. */
  getModelParameters: () => Promise<ModelParametersExport | null>;
  /** Interno: recalcula la frontera de decision con el modelo entrenado. */
  computeBoundaryInternal: () => Promise<void>;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  appStatus: 'initializing',
  datasetError: null,
  dataset: null,

  targetRepresentation: 'pm1',
  selectedFeatureIds: [...DEFAULT_FEATURE_IDS],
  hiddenLayers: initialHiddenLayers(),
  outputActivation: null,

  trainingStatus: 'idle',
  trainingError: null,
  lossHistory: [],
  currentEpoch: 0,
  currentLoss: NaN,
  currentAccuracy: NaN,
  metrics: null,
  cvMetrics: null,
  cvProgress: null,

  boundary: null,
  boundaryLoading: false,

  init: async () => {
    set({ appStatus: 'loading_dataset', datasetError: null });
    try {
      const dataset = await loadDataset('/data.csv');
      set({ dataset, appStatus: 'dataset_ready' });
    } catch (err) {
      const message =
        err instanceof DatasetError
          ? err.message
          : 'Error inesperado al cargar el dataset.';
      // Nunca se envia a servicios externos; solo consola en desarrollo.
      console.error('Error cargando dataset:', err);
      set({ appStatus: 'dataset_error', datasetError: message });
    }
  },

  setTargetRepresentation: (rep) => {
    if (get().isLocked()) return;
    set({ targetRepresentation: rep });
  },

  toggleFeature: (id) => {
    if (get().isLocked()) return;
    const current = get().selectedFeatureIds;
    const isSelected = current.includes(id);
    // No permitir quedarse con menos del minimo de features.
    if (isSelected && current.length <= MIN_SELECTED_FEATURES) return;
    const next = isSelected
      ? current.filter((f) => f !== id)
      : [...current, id];
    set({ selectedFeatureIds: next });
  },

  addHiddenLayer: () => {
    if (get().isLocked()) return;
    const layers = get().hiddenLayers;
    if (!canAddLayer(layers)) return;
    set({ hiddenLayers: [...layers, emptyHiddenLayer()] });
  },

  removeHiddenLayer: (index) => {
    if (get().isLocked()) return;
    const layers = get().hiddenLayers;
    if (!canRemoveLayer(layers)) return;
    set({ hiddenLayers: layers.filter((_, i) => i !== index) });
  },

  setLayerUnits: (index, units) => {
    if (get().isLocked()) return;
    const layers = get().hiddenLayers.slice();
    if (!layers[index]) return;
    layers[index] = {
      ...layers[index],
      units: units === null ? null : clampUnits(units),
    };
    set({ hiddenLayers: layers });
  },

  setLayerActivation: (index, activation) => {
    if (get().isLocked()) return;
    const layers = get().hiddenLayers.slice();
    if (!layers[index]) return;
    layers[index] = { ...layers[index], activation };
    set({ hiddenLayers: layers });
  },

  setOutputActivation: (activation) => {
    if (get().isLocked()) return;
    set({ outputActivation: activation });
  },

  getArchitecture: () => {
    const state = get();
    return {
      inputSize: inputSizeFor(state.selectedFeatureIds),
      hiddenLayers: state.hiddenLayers,
      outputActivation: state.outputActivation,
    };
  },

  isLocked: () => {
    const s = get().trainingStatus;
    return s === 'training' || s === 'paused' || s === 'validating';
  },

  canExport: () => {
    return get().metrics !== null && trainingEngine.getModel() !== null;
  },

  getModelParameters: async () => {
    const model = trainingEngine.getModel();
    if (!model) return null;
    return extractModelParameters(model, trainedFeatureIds);
  },

  startTraining: async () => {
    const state = get();
    if (trainingEngine.isRunning()) return;
    const dataset = state.dataset;
    if (!dataset) return;

    // La arquitectura debe estar completa (sin valores sin setear).
    const arch = state.getArchitecture();
    if (!validateArchitecture(arch).valid) return;
    const resolved = resolveArchitecture(arch);

    // Preparar datos: features -> preprocesamiento -> etiquetas {0,1}.
    // El conjunto de entrenamiento del modelo final es SIEMPRE el total.
    const rawMatrix = buildFeatureMatrix(dataset.rows, state.selectedFeatureIds);
    const scaler = fitScaler(rawMatrix, TRAINING_CONFIG.preprocessing);
    const features = transformMatrix(rawMatrix, scaler);
    const labels = buildBinaryLabels(dataset.rows);

    currentScaler = scaler;
    trainedFeatureIds = [...state.selectedFeatureIds];

    set({
      trainingStatus: 'training',
      trainingError: null,
      lossHistory: [],
      currentEpoch: 0,
      currentLoss: NaN,
      currentAccuracy: NaN,
      metrics: null,
      cvMetrics: null,
      cvProgress: null,
      boundary: null,
    });

    await trainingEngine.start(
      resolved,
      { features, labels },
      {
        onEpoch: (point) => {
          set((s) => ({
            lossHistory: [...s.lossHistory, point],
            currentEpoch: point.epoch,
            currentLoss: point.loss,
            currentAccuracy: point.accuracy,
          }));
        },
        onPhase: (phase) => {
          // Solo pasamos a 'validating'; el estado final lo fija onFinish.
          if (phase === 'validating') {
            set({
              trainingStatus: 'validating',
              cvProgress: {
                fold: 0,
                total: TRAINING_CONFIG.crossValidation.folds,
              },
            });
          }
        },
        onCvProgress: (done, total) => {
          set({ cvProgress: { fold: done, total } });
        },
        onFinish: (metrics, cvMetrics, status) => {
          set({
            trainingStatus: status,
            metrics,
            cvMetrics,
            cvProgress: null,
          });
          void get().computeBoundaryInternal();
        },
        onError: (message) => {
          console.error('Error de entrenamiento:', message);
          set({ trainingStatus: 'error', trainingError: message, cvProgress: null });
        },
      },
    );
  },

  pauseTraining: () => {
    if (get().trainingStatus !== 'training') return;
    trainingEngine.pause();
    set({ trainingStatus: 'paused' });
  },

  resumeTraining: () => {
    if (get().trainingStatus !== 'paused') return;
    trainingEngine.resume();
    set({ trainingStatus: 'training' });
  },

  stopTraining: () => {
    const s = get().trainingStatus;
    if (s !== 'training' && s !== 'paused' && s !== 'validating') return;
    trainingEngine.stop();
    // El estado final (stopped) lo fija onFinish del engine.
  },

  resetExperiment: () => {
    trainingEngine.dispose();
    currentScaler = null;
    trainedFeatureIds = [];
    set({
      targetRepresentation: 'pm1',
      selectedFeatureIds: [...DEFAULT_FEATURE_IDS],
      hiddenLayers: initialHiddenLayers(),
      outputActivation: null,
      trainingStatus: 'idle',
      trainingError: null,
      lossHistory: [],
      currentEpoch: 0,
      currentLoss: NaN,
      currentAccuracy: NaN,
      metrics: null,
      cvMetrics: null,
      cvProgress: null,
      boundary: null,
      boundaryLoading: false,
    });
  },

  // Metodo interno (no en la interfaz publica) para calcular la frontera.
  computeBoundaryInternal: async () => {
    const state = get();
    const model = trainingEngine.getModel();
    const dataset = state.dataset;
    if (!model || !dataset || !currentScaler) return;

    set({ boundaryLoading: true });
    try {
      const xs = dataset.rows.map((r) => r.x);
      const ys = dataset.rows.map((r) => r.y);
      const pad = 0.1;
      const xMin = Math.min(...xs) - pad;
      const xMax = Math.max(...xs) + pad;
      const yMin = Math.min(...ys) - pad;
      const yMax = Math.max(...ys) + pad;

      const boundary = await computeDecisionBoundary(model, {
        xMin,
        xMax,
        yMin,
        yMax,
        resolution: BOUNDARY_RESOLUTION,
        selectedFeatureIds: trainedFeatureIds,
        scaler: currentScaler,
      });
      set({ boundary, boundaryLoading: false });
    } catch (err) {
      console.error('Error calculando frontera de decision:', err);
      set({ boundaryLoading: false });
    }
  },
}));
