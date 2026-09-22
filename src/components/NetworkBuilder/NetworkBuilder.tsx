import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useExperimentStore } from '../../store/experimentStore';
import { PLAYGROUND_CONFIG, type ActivationName } from '../../config/playground';
import { selectedFeatureLabels } from '../../lib/featureEngineering';
import {
  canAddLayer,
  canRemoveLayer,
  validateArchitecture,
} from '../../lib/architecture';
import { NetworkGraph } from '../NetworkGraph/NetworkGraph';

export function NetworkBuilder() {
  const selectedIds = useExperimentStore((s) => s.selectedFeatureIds);
  const hiddenLayers = useExperimentStore((s) => s.hiddenLayers);
  const outputActivation = useExperimentStore((s) => s.outputActivation);
  const isLocked = useExperimentStore((s) => s.isLocked());

  const addLayer = useExperimentStore((s) => s.addHiddenLayer);
  const removeLayer = useExperimentStore((s) => s.removeHiddenLayer);
  const setUnits = useExperimentStore((s) => s.setLayerUnits);
  const setActivation = useExperimentStore((s) => s.setLayerActivation);
  const setOutput = useExperimentStore((s) => s.setOutputActivation);
  const getArchitecture = useExperimentStore((s) => s.getArchitecture);

  const inputLabels = selectedFeatureLabels(selectedIds);
  const validation = validateArchitecture(getArchitecture());
  const { minNeuronsPerLayer, maxNeuronsPerLayer } = PLAYGROUND_CONFIG;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Editor de arquitectura
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Capa de entrada: {inputLabels.length} inputs (
              {inputLabels.join(', ')}). Se determina automaticamente a partir de
              las features.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No hay arquitectura por defecto: agregue capas y complete neuronas y
              activaciones (incluida la de salida).
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {hiddenLayers.length === 0 && (
                <Alert severity="info">
                  Todavia no hay capas ocultas. Agregue al menos{' '}
                  {PLAYGROUND_CONFIG.minHiddenLayers}.
                </Alert>
              )}

              {hiddenLayers.map((layer, i) => (
                <Card key={i} variant="outlined" sx={{ bgcolor: '#fafbfc' }}>
                  <CardContent sx={{ pb: '12px !important' }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        Capa oculta {i + 1}
                      </Typography>
                      <Tooltip
                        title={
                          canRemoveLayer(hiddenLayers)
                            ? 'Eliminar capa'
                            : `Minimo ${PLAYGROUND_CONFIG.minHiddenLayers} capa(s)`
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            disabled={isLocked || !canRemoveLayer(hiddenLayers)}
                            onClick={() => removeLayer(i)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>

                    <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        label="Neuronas"
                        value={layer.units ?? ''}
                        disabled={isLocked}
                        placeholder="—"
                        inputProps={{
                          min: minNeuronsPerLayer,
                          max: maxNeuronsPerLayer,
                          step: 1,
                        }}
                        helperText={`${minNeuronsPerLayer}–${maxNeuronsPerLayer}`}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setUnits(i, raw === '' ? null : Number(raw));
                        }}
                        sx={{ width: 130 }}
                      />
                      <TextField
                        select
                        size="small"
                        label="Activacion"
                        value={layer.activation ?? ''}
                        disabled={isLocked}
                        helperText={layer.activation ? ' ' : 'Elegir'}
                        onChange={(e) =>
                          setActivation(i, e.target.value as ActivationName)
                        }
                        sx={{ flex: 1 }}
                      >
                        <MenuItem value="" disabled>
                          <em>Seleccionar</em>
                        </MenuItem>
                        {PLAYGROUND_CONFIG.allowedHiddenActivations.map((a) => (
                          <MenuItem key={a} value={a}>
                            {a}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                disabled={isLocked || !canAddLayer(hiddenLayers)}
                onClick={addLayer}
              >
                Agregar capa oculta
                {` (max ${PLAYGROUND_CONFIG.maxHiddenLayers})`}
              </Button>

              <Card variant="outlined" sx={{ bgcolor: '#fafbfc' }}>
                <CardContent sx={{ pb: '16px !important' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Capa de salida (fija: Dense(1))
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Activacion de salida"
                    value={outputActivation ?? ''}
                    disabled={isLocked}
                    helperText={outputActivation ? ' ' : 'Elegir activacion de salida'}
                    onChange={(e) =>
                      setOutput(e.target.value as ActivationName)
                    }
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccionar</em>
                    </MenuItem>
                    {PLAYGROUND_CONFIG.allowedOutputActivations.map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </TextField>
                </CardContent>
              </Card>

              {!validation.valid && (
                <Alert severity="warning">
                  {validation.errors.join(' ')}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Diagrama de la red
            </Typography>
            <NetworkGraph
              inputLabels={inputLabels}
              hiddenLayers={hiddenLayers}
              outputActivation={outputActivation}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
