import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { HiddenLayerConfig } from '../../types/model';
import type { ActivationName } from '../../config/playground';
import { CLASS_COLORS } from '../../theme';

interface NetworkGraphProps {
  inputLabels: string[];
  hiddenLayers: HiddenLayerConfig[];
  outputActivation: ActivationName | null;
}

/** Numero maximo de neuronas dibujadas por columna (por legibilidad). */
const MAX_DRAWN = 12;

interface LayerView {
  title: string;
  subtitle: string;
  count: number;
  drawn: number;
  color: string;
}

export function NetworkGraph({
  inputLabels,
  hiddenLayers,
  outputActivation,
}: NetworkGraphProps) {
  const layers = useMemo<LayerView[]>(() => {
    const input: LayerView = {
      title: 'INPUT',
      subtitle: inputLabels.join(', '),
      count: inputLabels.length,
      drawn: Math.min(inputLabels.length, MAX_DRAWN),
      color: '#37474f',
    };
    const hidden: LayerView[] = hiddenLayers.map((l, i) => {
      const units = l.units ?? 0;
      return {
        title: `HIDDEN ${i + 1}`,
        subtitle: `${l.units ?? '?'} · ${l.activation ?? '—'}`,
        count: units,
        // Si aun no hay neuronas definidas, dibujamos 1 nodo tenue de marcador.
        drawn: units > 0 ? Math.min(units, MAX_DRAWN) : 1,
        color: '#1f4e79',
      };
    });
    const output: LayerView = {
      title: 'OUTPUT',
      subtitle: `1 · ${outputActivation ?? '—'}`,
      count: 1,
      drawn: 1,
      color: CLASS_COLORS.positive,
    };
    return [input, ...hidden, output];
  }, [inputLabels, hiddenLayers, outputActivation]);

  const width = 720;
  const height = 340;
  const marginX = 60;
  const marginTop = 40;
  const usableHeight = height - marginTop - 30;
  const colGap =
    layers.length > 1 ? (width - 2 * marginX) / (layers.length - 1) : 0;
  const radius = 9;

  const positions = layers.map((layer, li) => {
    const cx = marginX + li * colGap;
    const n = layer.drawn;
    const step = n > 1 ? usableHeight / (n - 1) : 0;
    const startY =
      n > 1 ? marginTop + 10 : marginTop + 10 + usableHeight / 2;
    return Array.from({ length: n }, (_, ni) => ({
      cx,
      cy: n > 1 ? startY + ni * step : startY,
    }));
  });

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Diagrama de la arquitectura de la red"
      >
        {/* Conexiones */}
        {positions.slice(0, -1).map((col, li) =>
          col.map((a, ai) =>
            positions[li + 1].map((b, bi) => (
              <line
                key={`c-${li}-${ai}-${bi}`}
                x1={a.cx}
                y1={a.cy}
                x2={b.cx}
                y2={b.cy}
                stroke="#c4cdd5"
                strokeWidth={0.6}
              />
            )),
          ),
        )}

        {/* Nodos + etiquetas */}
        {layers.map((layer, li) => (
          <g key={`l-${li}`}>
            <text
              x={positions[li][0].cx}
              y={22}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="#37474f"
            >
              {layer.title}
            </text>
            <text
              x={positions[li][0].cx}
              y={height - 12}
              textAnchor="middle"
              fontSize={11}
              fill="#607d8b"
            >
              {layer.subtitle}
            </text>
            {positions[li].map((p, pi) => (
              <circle
                key={`n-${li}-${pi}`}
                cx={p.cx}
                cy={p.cy}
                r={radius}
                fill={layer.color}
                opacity={0.9}
              />
            ))}
            {layer.count > layer.drawn && (
              <text
                x={positions[li][0].cx}
                y={positions[li][layer.drawn - 1].cy + 22}
                textAnchor="middle"
                fontSize={11}
                fill="#607d8b"
              >
                +{layer.count - layer.drawn} mas
              </text>
            )}
          </g>
        ))}
      </svg>
    </Box>
  );
}
