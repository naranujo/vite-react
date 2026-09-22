import { useEffect, useRef } from 'react';
import { useExperimentStore } from '../store/experimentStore';

/**
 * Dispara la carga del dataset al montar y expone su estado.
 */
export function useDataset() {
  const appStatus = useExperimentStore((s) => s.appStatus);
  const dataset = useExperimentStore((s) => s.dataset);
  const datasetError = useExperimentStore((s) => s.datasetError);
  const init = useExperimentStore((s) => s.init);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current && appStatus === 'initializing') {
      started.current = true;
      void init();
    }
  }, [appStatus, init]);

  return { appStatus, dataset, datasetError };
}
