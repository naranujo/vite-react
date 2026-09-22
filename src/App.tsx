import { useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Step,
  StepButton,
  Stepper,
  Toolbar,
  Typography,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useDataset } from './hooks/useDataset';
import { useExperimentStore } from './store/experimentStore';
import { DataView } from './components/DataView/DataView';
import { FeatureSelector } from './components/FeatureSelector/FeatureSelector';
import { NetworkBuilder } from './components/NetworkBuilder/NetworkBuilder';
import { TrainingPanel } from './components/TrainingPanel/TrainingPanel';
import { ResultsPanel } from './components/ResultsPanel/ResultsPanel';
import { selectedFeatureLabels, classNames } from './lib/featureEngineering';

const STEPS = ['Datos', 'Features', 'Arquitectura', 'Entrenamiento', 'Resultados'];

export default function App() {
  const { appStatus, datasetError } = useDataset();
  const [activeStep, setActiveStep] = useState(0);

  const reset = useExperimentStore((s) => s.resetExperiment);
  const selectedIds = useExperimentStore((s) => s.selectedFeatureIds);
  const hiddenLayers = useExperimentStore((s) => s.hiddenLayers);
  const rep = useExperimentStore((s) => s.targetRepresentation);
  const status = useExperimentStore((s) => s.trainingStatus);

  const featureLabels = selectedFeatureLabels(selectedIds);
  const [negName, posName] = classNames(rep);

  const handleReset = () => {
    reset();
    setActiveStep(0);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h1">
              Neural Network Playground
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Experimentacion local con TensorFlow.js — los datos no salen del
              navegador
            </Typography>
          </Box>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={handleReset}
            sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
          >
            Reiniciar experimento
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {appStatus === 'loading_dataset' || appStatus === 'initializing' ? (
          <Box display="flex" alignItems="center" gap={2} py={6}>
            <CircularProgress size={24} />
            <Typography>Cargando dataset...</Typography>
          </Box>
        ) : appStatus === 'dataset_error' ? (
          <Alert severity="error">
            No se pudo cargar el dataset. {datasetError} Verifique que exista{' '}
            <strong>public/data.csv</strong> con el header <code>x,y,z</code>.
          </Alert>
        ) : (
          <>
            <Stepper
              nonLinear
              activeStep={activeStep}
              sx={{ mb: 3, flexWrap: 'wrap' }}
            >
              {STEPS.map((label, i) => (
                <Step key={label}>
                  <StepButton color="inherit" onClick={() => setActiveStep(i)}>
                    {label}
                  </StepButton>
                </Step>
              ))}
            </Stepper>

            <ConfigSummary
              featureLabels={featureLabels}
              hiddenCount={hiddenLayers.length}
              classesLabel={`${negName} / ${posName}`}
              status={status}
            />

            <Box sx={{ mt: 3 }}>
              {activeStep === 0 && <DataView />}
              {activeStep === 1 && <FeatureSelector />}
              {activeStep === 2 && <NetworkBuilder />}
              {activeStep === 3 && <TrainingPanel />}
              {activeStep === 4 && <ResultsPanel />}
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              sx={{ mt: 4 }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="contained"
                disabled={activeStep === STEPS.length - 1}
                onClick={() =>
                  setActiveStep((s) => Math.min(STEPS.length - 1, s + 1))
                }
              >
                Siguiente
              </Button>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

interface ConfigSummaryProps {
  featureLabels: string[];
  hiddenCount: number;
  classesLabel: string;
  status: string;
}

function ConfigSummary({
  featureLabels,
  hiddenCount,
  classesLabel,
  status,
}: ConfigSummaryProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      sx={{
        p: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Chip
        size="small"
        variant="outlined"
        label={`Target: ${classesLabel}`}
      />
      <Chip
        size="small"
        variant="outlined"
        label={`Inputs: ${featureLabels.length} (${featureLabels.join(', ')})`}
      />
      <Chip
        size="small"
        variant="outlined"
        label={`Capas ocultas: ${hiddenCount}`}
      />
      <Chip size="small" variant="outlined" label={`Estado: ${status}`} />
    </Stack>
  );
}
