import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { useExperimentStore } from '../../store/experimentStore';
import type { ModelParametersExport } from '../../lib/exportModel';
import { ConfusionMatrixView } from '../ConfusionMatrix/ConfusionMatrix';
import { DecisionBoundary } from '../DecisionBoundary/DecisionBoundary';

function pct(v: number): string {
  return `${(v * 100).toFixed(2)} %`;
}

function pm(mean: number, sd: number): string {
  return `${(mean * 100).toFixed(2)} % ± ${(sd * 100).toFixed(2)}`;
}

function formatWeight(value: number): string {
  return value.toFixed(4).replace('.', ',');
}

function matricesForClipboard(parameters: ModelParametersExport): string {
  return parameters.layers
    .map((layer, layerIndex) => {
      const header = ['', ...layer.weights[0].map((_, i) => `n${i + 1}`)].join(';');
      const rows = layer.weights.map((row, weightIndex) =>
        [`w${weightIndex}`, ...row.map(formatWeight)].join(';'),
      );
      const biases = ['bias', ...layer.biases.map(formatWeight)].join(';');
      return [`Capa ${layerIndex + 1}`, header, ...rows, biases].join('\n');
    })
    .join('\n\n');
}

export function ResultsPanel() {
  const metrics = useExperimentStore((s) => s.metrics);
  const cvMetrics = useExperimentStore((s) => s.cvMetrics);
  const rep = useExperimentStore((s) => s.targetRepresentation);
  const status = useExperimentStore((s) => s.trainingStatus);
  const canExport = useExperimentStore((s) => s.canExport());
  const getModelParameters = useExperimentStore((s) => s.getModelParameters);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [parameters, setParameters] = useState<ModelParametersExport | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShowParameters = async () => {
    setLoadingParameters(true);
    try {
      const extracted = await getModelParameters();
      setParameters(extracted);
      setCopied(false);
    } finally {
      setLoadingParameters(false);
    }
  };

  const handleCopyMatrices = async () => {
    if (!parameters) return;
    await navigator.clipboard.writeText(matricesForClipboard(parameters));
    setCopied(true);
  };

  if (!metrics) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resultados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Todavia no hay resultados. Entrena un modelo en la etapa
            Entrenamiento para ver las metricas, la matriz de confusion y la
            frontera de decision.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="h6" gutterBottom>
                Resultados
                {status === 'stopped' && ' (entrenamiento detenido)'}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DataObjectIcon />}
                disabled={!canExport || loadingParameters}
                onClick={() => void handleShowParameters()}
              >
                {loadingParameters ? 'Leyendo...' : 'Ver pesos'}
              </Button>
            </Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Modelo final (entrenado con el total de los datos)
            </Typography>
            <Grid container spacing={2}>
              <StatCell label="Epochs ejecutadas" value={String(metrics.epochsRun)} />
              <StatCell label="Loss final" value={metrics.loss.toFixed(4)} />
              <StatCell label="Accuracy" value={pct(metrics.accuracy)} />
              <StatCell label="Precision" value={pct(metrics.precision)} />
              <StatCell label="Recall" value={pct(metrics.recall)} />
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cross-validation
              {cvMetrics ? ` (${cvMetrics.folds}-fold, media ± desvio)` : ''}
            </Typography>
            {cvMetrics ? (
              <Grid container spacing={2}>
                <StatCell label="Accuracy (CV)" value={pm(cvMetrics.accuracyMean, cvMetrics.accuracyStd)} />
                <StatCell label="Precision (CV)" value={pm(cvMetrics.precisionMean, cvMetrics.precisionStd)} />
                <StatCell label="Recall (CV)" value={pm(cvMetrics.recallMean, cvMetrics.recallStd)} />
                <StatCell label="Loss (CV)" value={`${cvMetrics.lossMean.toFixed(4)} ± ${cvMetrics.lossStd.toFixed(4)}`} />
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay metricas de cross-validation (se detuvo antes de
                completarla o esta deshabilitada).
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <ConfusionMatrixView
              matrix={metrics.confusion}
              representation={rep}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardContent>
            <DecisionBoundary />
          </CardContent>
        </Card>
      </Grid>

      <Dialog
        open={parameters !== null}
        onClose={() => setParameters(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Pesos del modelo</DialogTitle>
        <DialogContent>
          {parameters?.layers.map((layer, layerIndex) => (
            <Box key={layer.index} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Capa {layerIndex + 1}
              </Typography>
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table size="small" aria-label={`Matriz de pesos de la capa ${layerIndex + 1}`}>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      {layer.weights[0]?.map((_, neuronIndex) => (
                        <TableCell key={neuronIndex} align="right">
                          n{neuronIndex + 1}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {layer.weights.map((row, weightIndex) => (
                      <TableRow key={weightIndex}>
                        <TableCell component="th" scope="row">
                          w{weightIndex}
                        </TableCell>
                        {row.map((weight, neuronIndex) => (
                          <TableCell key={neuronIndex} align="right">
                            {formatWeight(weight)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        bias
                      </TableCell>
                      {layer.biases.map((bias, neuronIndex) => (
                        <TableCell key={neuronIndex} align="right">
                          {formatWeight(bias)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParameters(null)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            onClick={() => void handleCopyMatrices()}
          >
            {copied ? 'Copiado' : 'Copiar matrices'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={6}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Grid>
  );
}
