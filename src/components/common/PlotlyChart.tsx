import { useEffect, useRef } from 'react';
import Plotly, {
  type PlotData,
  type Layout,
  type Config,
} from 'plotly.js-dist-min';

interface PlotlyChartProps {
  data: PlotData[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  style?: React.CSSProperties;
}

const DEFAULT_CONFIG: Partial<Config> = {
  responsive: true,
  displaylogo: false,
  // Evita cualquier request externo (por ejemplo envio a la nube de Plotly).
  modeBarButtonsToRemove: ['sendDataToCloud', 'toImage'],
};

/**
 * Envoltorio imperativo sobre Plotly.js. Usa Plotly.react (eficiente para
 * actualizaciones) y purga el grafico al desmontar para evitar fugas.
 */
export function PlotlyChart({ data, layout, config, style }: PlotlyChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    void Plotly.react(el, data, layout ?? {}, {
      ...DEFAULT_CONFIG,
      ...config,
    });
  }, [data, layout, config]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el) Plotly.purge(el);
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 360, ...style }} />;
}
