import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';
import { useExperimentStore } from '../../store/experimentStore';
import { TRAINING_CONFIG } from '../../config/training';
import { validateArchitecture } from '../../lib/architecture';
import { LossChart } from '../LossChart/LossChart';
import type { TrainingStatus } from '../../types/training';

const STATUS_LABEL: Record<TrainingStatus, string> = {
  idle: 'Sin entrenar',
  training: 'Entrenando',
  paused: 'Pausado',
  validating: 'Validando (CV)',
  stopped: 'Detenido',
  finished: 'Finalizado',
  error: 'Error',
};

const STATUS_COLOR: Record<
  TrainingStatus,
  'default' | 'primary' | 'warning' | 'success' | 'error' | 'info'
> = {
  idle: 'default',
  training: 'primary',
  paused: 'warning',
  validating: 'info',
  stopped: 'default',
  finished: 'success',
  error: 'error',
};

function fmt(v: number): string {
  return Number.isFinite(v) ? v.toFixed(4) : '—';
}

function fmtLearningRate(v: number): string {
  return v.toLocaleString('es-AR', { maximumFractionDigits: 8 });
}

export function TrainingPanel() {
  const status = useExperimentStore((s) => s.trainingStatus);
  const trainingError = useExperimentStore((s) => s.trainingError);
  const currentEpoch = useExperimentStore((s) => s.currentEpoch);
  const currentLoss = useExperimentStore((s) => s.currentLoss);
  const currentAccuracy = useExperimentStore((s) => s.currentAccuracy);
  const cvProgress = useExperimentStore((s) => s.cvProgress);
  const getArchitecture = useExperimentStore((s) => s.getArchitecture);

  const start = useExperimentStore((s) => s.startTraining);
  const pause = useExperimentStore((s) => s.pauseTraining);
  const resume = useExperimentStore((s) => s.resumeTraining);
  const stop = useExperimentStore((s) => s.stopTraining);
  const reset = useExperimentStore((s) => s.resetExperiment);

  const isRunning = status === 'training';
  const isPaused = status === 'paused';
  const isValidating = status === 'validating';
  const isActive = isRunning || isPaused;
  const isBusy = isActive || isValidating;
  const validation = validateArchitecture(getArchitecture());
  const progress = Math.min(
    100,
    (currentEpoch / TRAINING_CONFIG.maxEpochs) * 100,
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Entrenamiento</Typography>
              <Chip
                size="small"
                label={STATUS_LABEL[status]}
                color={STATUS_COLOR[status]}
              />
            </Box>

            {!validation.valid && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {validation.errors.join(' ')}
              </Alert>
            )}
            {status === 'error' && trainingError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Ocurrio un error durante el entrenamiento.
              </Alert>
            )}

            <Stack spacing={1.5}>
              {!isBusy ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  disabled={!validation.valid}
                  onClick={() => void start()}
                >
                  Entrenar
                </Button>
              ) : isValidating ? (
                <Button variant="contained" disabled startIcon={<PlayArrowIcon />}>
                  Validando...
                </Button>
              ) : isRunning ? (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<PauseIcon />}
                  onClick={pause}
                >
                  Pausar
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={resume}
                >
                  Reanudar
                </Button>
              )}

              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                disabled={!isBusy}
                onClick={stop}
              >
                Detener
              </Button>

              <Button
                variant="text"
                startIcon={<ReplayIcon />}
                onClick={reset}
              >
                Reiniciar experimento
              </Button>
            </Stack>

            <Box mt={3}>
              <Typography variant="body2" color="text.secondary">
                Epoch: {currentEpoch} / {TRAINING_CONFIG.maxEpochs}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ my: 1, height: 8, borderRadius: 4 }}
              />
              <Stack direction="row" justifyContent="space-between" mt={1}>
                <Metric label="Loss" value={fmt(currentLoss)} />
                <Metric label="Accuracy" value={fmt(currentAccuracy)} />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Tasa de aprendizaje: {fmtLearningRate(TRAINING_CONFIG.learningRate)}
              </Typography>

              {isValidating && cvProgress && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Cross-validation: fold {cvProgress.fold} / {cvProgress.total}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(cvProgress.fold / cvProgress.total) * 100}
                    color="info"
                    sx={{ my: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 2 }}
            >
              El modelo final entrena con el total de los datos (batch gradient
              descent). Si se alcanza accuracy 1.0, se ejecuta una epoca mas y
              el proceso finaliza sin cross-validation. Durante el proceso se
              bloquea la edicion de dataset, target, features y arquitectura.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <LossChart />
      </Grid>
    </Grid>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );
}
