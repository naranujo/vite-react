import { useMemo } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { useExperimentStore } from '../../store/experimentStore';
import { PlotlyChart } from '../common/PlotlyChart';
import type { PlotData } from 'plotly.js-dist-min';

export function LossChart() {
  const lossHistory = useExperimentStore((s) => s.lossHistory);

  const data = useMemo<PlotData[]>(() => {
    const epochs = lossHistory.map((p) => p.epoch);
    const loss = lossHistory.map((p) => p.loss);
    const acc = lossHistory.map((p) => p.accuracy);
    return [
      {
        x: epochs,
        y: loss,
        type: 'scattergl',
        mode: 'lines',
        name: 'Loss',
        line: { color: '#c65911', width: 2 },
      },
      {
        x: epochs,
        y: acc,
        type: 'scattergl',
        mode: 'lines',
        name: 'Accuracy',
        yaxis: 'y2',
        line: { color: '#1f4e79', width: 1.5, dash: 'dot' },
      },
    ];
  }, [lossHistory]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Funcion de perdida en tiempo real
        </Typography>
        <PlotlyChart
          data={data}
          layout={{
            margin: { l: 52, r: 52, t: 8, b: 44 },
            xaxis: { title: 'Epoch' },
            yaxis: { title: 'Loss', rangemode: 'tozero' },
            yaxis2: {
              title: 'Accuracy',
              overlaying: 'y',
              side: 'right',
              range: [0, 1],
            },
            legend: { orientation: 'h', y: -0.25 },
            uirevision: 'loss', // conserva zoom/pan entre actualizaciones
          }}
        />
      </CardContent>
    </Card>
  );
}
