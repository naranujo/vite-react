import { useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useExperimentStore } from '../../store/experimentStore';
import { PlotlyChart } from '../common/PlotlyChart';
import { CLASS_COLORS } from '../../theme';
import { classNames } from '../../lib/featureEngineering';
import type { PlotData } from 'plotly.js-dist-min';

export function DecisionBoundary() {
  const boundary = useExperimentStore((s) => s.boundary);
  const boundaryLoading = useExperimentStore((s) => s.boundaryLoading);
  const dataset = useExperimentStore((s) => s.dataset);
  const rep = useExperimentStore((s) => s.targetRepresentation);

  const data = useMemo<PlotData[]>(() => {
    if (!boundary || !dataset) return [];
    const [negName, posName] = classNames(rep);

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

    return [
      {
        x: boundary.xGrid,
        y: boundary.yGrid,
        z: boundary.z,
        type: 'contour',
        colorscale: [
          [0, CLASS_COLORS.negative],
          [0.5, '#f0f0f0'],
          [1, CLASS_COLORS.positive],
        ],
        opacity: 0.55,
        showscale: true,
        contours: { start: 0, end: 1, size: 0.1 },
        colorbar: { title: 'P(clase +)', titleside: 'right' },
        hoverinfo: 'skip',
      },
      {
        x: neg.x,
        y: neg.y,
        mode: 'markers',
        type: 'scattergl',
        name: `Clase ${negName}`,
        marker: {
          color: CLASS_COLORS.negative,
          size: 7,
          line: { color: '#fff', width: 1 },
        },
      },
      {
        x: pos.x,
        y: pos.y,
        mode: 'markers',
        type: 'scattergl',
        name: `Clase ${posName}`,
        marker: {
          color: CLASS_COLORS.positive,
          size: 7,
          line: { color: '#fff', width: 1 },
        },
      },
    ];
  }, [boundary, dataset, rep]);

  if (boundaryLoading) {
    return (
      <Box display="flex" alignItems="center" gap={2} py={4}>
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          Calculando frontera de decision...
        </Typography>
      </Box>
    );
  }

  if (!boundary) {
    return (
      <Typography variant="body2" color="text.secondary">
        La frontera de decision se mostrara al finalizar o detener el
        entrenamiento.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Frontera de decision (plano x / y)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        La frontera siempre se representa sobre x / y, aunque la red use features
        derivadas.
      </Typography>
      <PlotlyChart
        data={data}
        style={{ height: 460 }}
        layout={{
          margin: { l: 48, r: 16, t: 8, b: 40 },
          xaxis: { title: 'x' },
          yaxis: { title: 'y', scaleanchor: 'x' },
          legend: { orientation: 'h', y: -0.18 },
          hovermode: 'closest',
        }}
      />
    </Box>
  );
}
