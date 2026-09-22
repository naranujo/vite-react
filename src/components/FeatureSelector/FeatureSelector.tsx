import {
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useExperimentStore } from '../../store/experimentStore';
import { AVAILABLE_FEATURES, MIN_SELECTED_FEATURES } from '../../config/features';
import { selectedFeatureLabels } from '../../lib/featureEngineering';
import { TrainingInputsChart } from './TrainingInputsChart';

export function FeatureSelector() {
  const selectedIds = useExperimentStore((s) => s.selectedFeatureIds);
  const toggleFeature = useExperimentStore((s) => s.toggleFeature);
  const isLocked = useExperimentStore((s) => s.isLocked());

  const labels = selectedFeatureLabels(selectedIds);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feature engineering
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Se puede activar o desactivar cualquier feature, incluidas x e y.
                Debe quedar seleccionada al menos {MIN_SELECTED_FEATURES}. Las
                features derivadas se calculan dinamicamente en memoria.
              </Typography>
              <Stack sx={{ mt: 1 }}>
                {AVAILABLE_FEATURES.map((f) => {
                  const checked = selectedIds.includes(f.id);
                  const isLastSelected =
                    checked && selectedIds.length <= MIN_SELECTED_FEATURES;
                  return (
                    <FormControlLabel
                      key={f.id}
                      control={
                        <Checkbox
                          checked={checked}
                          disabled={isLocked || isLastSelected}
                          onChange={() => toggleFeature(f.id)}
                        />
                      }
                      label={
                        <span>
                          {f.label}
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {f.formula}
                          </Typography>
                        </span>
                      }
                    />
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Features utilizadas: {labels.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estas features forman el vector de entrada de la red.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {labels.map((l) => (
                  <Chip key={l} label={l} color="primary" variant="outlined" />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <TrainingInputsChart />
    </>
  );
}
