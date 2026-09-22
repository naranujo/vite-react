import { useExperimentStore } from '../store/experimentStore';

/** Expone estado y controles de entrenamiento. */
export function useTraining() {
  const trainingStatus = useExperimentStore((s) => s.trainingStatus);
  const trainingError = useExperimentStore((s) => s.trainingError);
  const currentEpoch = useExperimentStore((s) => s.currentEpoch);
  const currentLoss = useExperimentStore((s) => s.currentLoss);
  const currentAccuracy = useExperimentStore((s) => s.currentAccuracy);
  const lossHistory = useExperimentStore((s) => s.lossHistory);
  const metrics = useExperimentStore((s) => s.metrics);

  const startTraining = useExperimentStore((s) => s.startTraining);
  const pauseTraining = useExperimentStore((s) => s.pauseTraining);
  const resumeTraining = useExperimentStore((s) => s.resumeTraining);
  const stopTraining = useExperimentStore((s) => s.stopTraining);

  return {
    trainingStatus,
    trainingError,
    currentEpoch,
    currentLoss,
    currentAccuracy,
    lossHistory,
    metrics,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
  };
}
