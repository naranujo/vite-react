import { useMemo } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import type { PlotData } from 'plotly.js-dist-min';
import { useExperimentStore } from '../../store/experimentStore';
import {
  buildFeatureMatrix,
  classNames,
  resolveSelectedFeatures,
} from '../../lib/featureEngineering';
import { projectPca2d } from '../../lib/pca';
import { CLASS_COLORS } from '../../theme';
import { PlotlyChart } from '../common/PlotlyChart';

export function TrainingInputsChart() {
  const dataset = useExperimentStore((s) => s.dataset);
  const selectedIds = useExperimentStore((s) => s.selectedFeatureIds);
  const representation = useExperimentStore((s) => s.targetRepresentation);

  const chart = useMemo(() => {
    if (!dataset) return null;
    const features = resolveSelectedFeatures(selectedIds);
    const matrix = buildFeatureMatrix(dataset.rows, selectedIds);
    const [negativeName, positiveName] = classNames(representation);
    const negative = { x: [] as number[], y: [] as number[] };
    const positive = { x: [] as number[], y: [] as number[] };

    let xTitle: string;
    let yTitle: string;
    let subtitle: string;
    if (features.length === 1) {
      xTitle = features[0].label;
      yTitle = 'Clase';
      subtitle = 'Un input: se muestra su distribucion por clase.';
      matrix.forEach((row, index) => {
        const target = dataset.rows[index].z === 1 ? positive : negative;
        target.x.push(row[0]);
        target.y.push(dataset.rows[index].z === 1 ? 1 : 0);
      });
    } else if (features.length === 2) {
      xTitle = features[0].label;
      yTitle = features[1].label;
      subtitle = 'Dos inputs: se muestran directamente en sus ejes.';
      matrix.forEach((row, index) => {
        const target = dataset.rows[index].z === 1 ? positive : negative;
        target.x.push(row[0]);
        target.y.push(row[1]);
      });
    } else {
      const projection = projectPca2d(matrix);
      xTitle = `PCA 1 (${(projection.explainedVariance[0] * 100).toFixed(1)}% var.)`;
      yTitle = `PCA 2 (${(projection.explainedVariance[1] * 100).toFixed(1)}% var.)`;
      subtitle = ` ${features.length} inputs: proyeccion PCA 2D sobre features estandarizadas.`;
      projection.points.forEach((point, index) => {
        const target = dataset.rows[index].z === 1 ? positive : negative;
        target.x.push(point[0]);
        target.y.push(point[1]);
      });
    }

    const data: PlotData[] = [
      {
        x: negative.x,
        y: negative.y,
        mode: 'markers',
        type: 'scattergl',
        name: `Clase ${negativeName}`,
        marker: { color: CLASS_COLORS.negative, size: 7, opacity: 0.8 },
      },
      {
        x: positive.x,
        y: positive.y,
        mode: 'markers',
        type: 'scattergl',
        name: `Clase ${positiveName}`,
        marker: { color: CLASS_COLORS.positive, size: 7, opacity: 0.8 },
      },
    ];
    return { data, xTitle, yTitle, subtitle };
  }, [dataset, representation, selectedIds]);

  if (!chart) return null;

  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vista de los inputs de entrenamiento
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {chart.subtitle}
        </Typography>
        <PlotlyChart
          data={chart.data}
          layout={{
            margin: { l: 56, r: 16, t: 8, b: 48 },
            xaxis: { title: chart.xTitle, zeroline: true },
            yaxis:
              chart.yTitle === 'Clase'
                ? { title: chart.yTitle, tickvals: [0, 1] }
                : { title: chart.yTitle, zeroline: true },
            legend: { orientation: 'h', y: -0.2 },
            hovermode: 'closest',
          }}
        />
      </CardContent>
    </Card>
  );
}
