/**
 * Configuracion docente de FEATURES.
 *
 * Aqui se definen las features disponibles: nombre, etiqueta, formula y si
 * estan habilitadas / son obligatorias. Para agregar o quitar features NO hay
 * que tocar componentes de React: basta con editar este archivo.
 *
 * Cada feature deriva de las features originales `x` e `y`.
 */

/** Punto original leido del CSV. */
export interface RawPoint {
  x: number;
  y: number;
}

export interface FeatureDefinition {
  /** Identificador estable e interno. */
  id: string;
  /** Etiqueta mostrada al alumno. */
  label: string;
  /** Descripcion breve de la formula (documentacion en la UI). */
  formula: string;
  /**
   * Si es `true` la feature siempre se usa y no se puede desmarcar
   * (caso de `x` e `y`).
   */
  required: boolean;
  /** Si arranca seleccionada por defecto. */
  defaultEnabled: boolean;
  /** Si aparece como opcion disponible en la interfaz. */
  available: boolean;
  /** Funcion pura que calcula el valor de la feature para un punto. */
  compute: (p: RawPoint) => number;
}

/**
 * Orden = orden en que se presentan al alumno y en que se arma el input de la red.
 */
export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    id: 'x',
    label: 'x',
    formula: 'x',
    required: false,
    defaultEnabled: true,
    available: true,
    compute: (p) => p.x,
  },
  {
    id: 'y',
    label: 'y',
    formula: 'y',
    required: false,
    defaultEnabled: true,
    available: true,
    compute: (p) => p.y,
  },
  {
    id: 'xy',
    label: 'x · y',
    formula: 'x * y',
    required: false,
    defaultEnabled: false,
    available: true,
    compute: (p) => p.x * p.y,
  },
  {
    id: 'x2',
    label: 'x²',
    formula: 'x^2',
    required: false,
    defaultEnabled: false,
    available: true,
    compute: (p) => p.x * p.x,
  },
  {
    id: 'y2',
    label: 'y²',
    formula: 'y^2',
    required: false,
    defaultEnabled: false,
    available: true,
    compute: (p) => p.y * p.y,
  },
  {
    id: 'r',
    label: '√(x² + y²)',
    formula: 'sqrt(x^2 + y^2)',
    required: false,
    defaultEnabled: false,
    available: true,
    compute: (p) => Math.sqrt(p.x * p.x + p.y * p.y),
  },
];

/** Features que aparecen como opciones en la UI. */
export const AVAILABLE_FEATURES = FEATURE_DEFINITIONS.filter((f) => f.available);

/** Ids seleccionados por defecto al iniciar / reiniciar el experimento. */
export const DEFAULT_FEATURE_IDS: string[] = AVAILABLE_FEATURES.filter(
  (f) => f.defaultEnabled || f.required,
).map((f) => f.id);

/** Ids obligatorios (nunca se pueden desmarcar). Hoy: ninguno. */
export const REQUIRED_FEATURE_IDS: string[] = FEATURE_DEFINITIONS.filter(
  (f) => f.required,
).map((f) => f.id);

/**
 * Cantidad minima de features que el alumno debe mantener seleccionadas.
 * x e y pueden desactivarse, pero al menos una feature (cualquiera) es
 * obligatoria para poder construir la entrada de la red.
 */
export const MIN_SELECTED_FEATURES = 1;
