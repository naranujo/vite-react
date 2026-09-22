import { useExperimentStore } from '../store/experimentStore';
import { inputSizeFor, selectedFeatureLabels } from '../lib/featureEngineering';

/** Estado de configuracion del experimento (features, target, arquitectura). */
export function useExperiment() {
  const targetRepresentation = useExperimentStore((s) => s.targetRepresentation);
  const selectedFeatureIds = useExperimentStore((s) => s.selectedFeatureIds);
  const hiddenLayers = useExperimentStore((s) => s.hiddenLayers);
  const outputActivation = useExperimentStore((s) => s.outputActivation);
  const isLocked = useExperimentStore((s) => s.isLocked());

  const resetExperiment = useExperimentStore((s) => s.resetExperiment);

  return {
    targetRepresentation,
    selectedFeatureIds,
    hiddenLayers,
    outputActivation,
    isLocked,
    inputSize: inputSizeFor(selectedFeatureIds),
    featureLabels: selectedFeatureLabels(selectedFeatureIds),
    resetExperiment,
  };
}
