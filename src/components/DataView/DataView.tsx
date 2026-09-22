import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import { useExperimentStore } from '../../store/experimentStore';
import { PlotlyChart } from '../common/PlotlyChart';
import { CLASS_COLORS } from '../../theme';
import { labelForRepresentation, classNames } from '../../lib/featureEngineering';
import type { PlotData } from 'plotly.js-dist-min';

const PREVIEW_ROWS = 8;

export function DataView() {
  const dataset = useExperimentStore((s) => s.dataset);
  const rep = useExperimentStore((s) => s.targetRepresentation);
  const setRep = useExperimentStore((s) => s.setTargetRepresentation);
  const isLocked = useExperimentStore((s) => s.isLocked());

  const scatterData = useMemo<PlotData[]>(() => {
    if (!dataset) return [];
    const pos = { x: [] as number[], y: [] as number[] };
    const neg = { x: [] as number[], y: [] as number[] };
    for (const r of dataset.rows) {
      if (r.z === 1) {
        pos.x.push(r.x);
        pos.y.push(r.y);
      } else {
        neg.x.push(r.x);
        neg.y.push(r.y);
      }
    }
    const [negName, posName] = classNames(rep);
    return [
      {
        x: neg.x,
        y: neg.y,
        mode: 'markers',
        type: 'scattergl',
        name: `Clase ${negName}`,
        marker: { color: CLASS_COLORS.negative, size: 7, opacity: 0.8 },
      },
      {
        x: pos.x,
        y: pos.y,
        mode: 'markers',
        type: 'scattergl',
        name: `Clase ${posName}`,
        marker: { color: CLASS_COLORS.positive, size: 7, opacity: 0.8 },
      },
    ];
  }, [dataset, rep]);

  if (!dataset) return null;

  const [negName, posName] = classNames(rep);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dataset
            </Typography>
            <Stack spacing={1.2}>
              <InfoRow label="Filas" value={String(dataset.count)} />
              <InfoRow label="Columnas" value="x, y, z" />
              <InfoRow label="Features originales" value="x, y" />
              <InfoRow label="Target" value="z" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Clases
                </Typography>
                <Stack direction="row" spacing={1} mt={0.5}>
                  <Chip
                    label={negName}
                    size="small"
                    sx={{ bgcolor: CLASS_COLORS.negative, color: '#fff' }}
                  />
                  <Chip
                    label={posName}
                    size="small"
                    sx={{ bgcolor: CLASS_COLORS.positive, color: '#fff' }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Representacion del target
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Target original: {dataset.targetClasses.join(' / ')}. La
              transformacion es solo en memoria; el CSV nunca se modifica.
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={rep}
              disabled={isLocked}
              onChange={(_, value) => {
                if (value) setRep(value);
              }}
              sx={{ mt: 1 }}
            >
              <ToggleButton value="pm1">-1 / +1</ToggleButton>
              <ToggleButton value="zero_one">0 / 1</ToggleButton>
            </ToggleButtonGroup>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Visualizacion de datos
            </Typography>
            <PlotlyChart
              data={scatterData}
              layout={{
                margin: { l: 48, r: 16, t: 8, b: 40 },
                xaxis: { title: 'x', zeroline: true },
                yaxis: { title: 'y', zeroline: true, scaleanchor: 'x' },
                legend: { orientation: 'h', y: -0.2 },
                hovermode: 'closest',
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Primeras filas
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>x</TableCell>
                    <TableCell>y</TableCell>
                    <TableCell>z (original)</TableCell>
                    <TableCell>z (representacion)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataset.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.x}</TableCell>
                      <TableCell>{r.y}</TableCell>
                      <TableCell>{r.z}</TableCell>
                      <TableCell>
                        {labelForRepresentation(r.z === 1 ? 1 : 0, rep)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}
