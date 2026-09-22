/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Batch size opcional (docente). Vacia o 'full' => batch = cantidad de
   * registros (batch gradient descent). Entero positivo => mini-batch.
   */
  readonly VITE_BATCH_SIZE?: string;
  /** Maximo opcional de epocas. Entero positivo; si falta, se usan 1000. */
  readonly VITE_MAX_EPOCHS?: string;
  /** Loss opcional: 'meanSquaredError' (por defecto) o 'binaryCrossentropy'. */
  readonly VITE_LOSS?: string;
  /** Learning rate opcional. Numero positivo; si falta, se usa 0.01. */
  readonly VITE_LEARNING_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'plotly.js-dist-min' {
  // Tipado minimo suficiente para el uso imperativo que hacemos.
  export type PlotData = Record<string, unknown>;
  export type Layout = Record<string, unknown>;
  export type Config = Record<string, unknown>;

  export function react(
    root: HTMLElement,
    data: PlotData[],
    layout?: Partial<Layout>,
    config?: Partial<Config>,
  ): Promise<HTMLElement>;

  export function purge(root: HTMLElement): void;

  const Plotly: {
    react: typeof react;
    purge: typeof purge;
  };
  export default Plotly;
}
