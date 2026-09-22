# Neural Network Playground

Aplicacion web educativa **completamente client-side** para experimentar con
redes neuronales de clasificacion binaria directamente en el navegador, usando
**TensorFlow.js**. Pensada para una materia universitaria de Data Science /
Deep Learning y para ~100 alumnos entrenando simultaneamente (cada navegador
ejecuta su propio modelo; no hay servidor de entrenamiento).

---

## 1. Que hace la aplicacion

Permite al alumno, en cinco etapas guiadas:

1. **Datos** — ver informacion del dataset, un scatter plot interactivo y elegir
   la representacion del target (`-1 / +1` o `0 / 1`).
2. **Features** — activar features derivadas (`x·y`, `x²`, `y²`, `√(x²+y²)`) y
   ver en vivo los inputs que entrenaran el modelo. Con mas de dos inputs, la
   vista usa una proyeccion PCA 2D sobre features estandarizadas.
3. **Arquitectura** — definir desde cero las capas ocultas (cantidad, neuronas,
   activacion) y elegir la activacion de la salida, con un diagrama en vivo.
   No hay arquitectura por defecto: el alumno completa cada valor.
4. **Entrenamiento** — entrenar / pausar / reanudar / detener y ver la funcion
   de perdida en tiempo real. El modelo final entrena con el total de los datos.
5. **Resultados** — metricas del modelo final, metricas de **k-fold
   cross-validation** (media ± desvio), matriz de confusion y frontera de
   decision sobre el plano `x / y`.

---

## 2. Stack

- React 18 + TypeScript (estricto)
- Vite 5
- Material UI (MUI) 6
- Zustand 5 (estado en memoria)
- TensorFlow.js 4 (entrenamiento en el navegador)
- Plotly.js (graficos interactivos)
- Papa Parse (lectura de CSV)
- Vitest (tests)
- Deploy: Vercel (solo archivos estaticos)

---

## 3. Instalacion

```bash
npm install
```

## 4. Ejecutar localmente

```bash
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

## 5. Build de produccion

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ localmente para verificar
```

## 6. Tests

```bash
npm test
```

## 7. Deploy en Vercel

El proyecto es una SPA estatica. Opciones:

- **Dashboard de Vercel**: importar el repositorio. Vercel detecta Vite
  automaticamente (`vercel.json` ya fija framework, build y output).
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **CLI**:
  ```bash
  npm i -g vercel
  vercel
  vercel --prod
  ```

No se requieren funciones serverless ni API routes. La unica variable de entorno
es opcional (`VITE_BATCH_SIZE`, `VITE_MAX_EPOCHS`, `VITE_LOSS` y
`VITE_LEARNING_RATE`, ver mas abajo); si no se define, la app funciona
con su configuracion por defecto.

---

## 8. Dataset: donde y como

- Ubicacion **exacta**: `public/data.csv`
- La app lo carga automaticamente desde `/data.csv` al iniciar.
- El archivo original **nunca se modifica**: todas las transformaciones ocurren
  en memoria.

### Formato esperado

- Separador de columnas: `,`
- Separador decimal: `.` (no se usa la configuracion regional del navegador)
- Header exacto:

  ```text
  x,y,z
  ```

- `x`, `y`: features numericas.
- `z`: target binario, con valores `-1` y `1`, o bien `0` y `1` (sin mezclar ambas codificaciones).

Ejemplo:

```text
x,y,z
0.25,0.80,-1
0.42,0.31,1
0.73,0.65,-1
```

### Validaciones

Al cargar se valida: existencia de `/data.csv`, columnas `x,y,z`, que `x`, `y`,
`z` sean numericos, que `z` use solo `-1`/`1` o `0`/`1`, y ausencia de vacios, `NaN` e
`Infinity`. Si algo falla se muestra un mensaje comprensible (sin stack traces).

---

## 9. Configuracion docente

Toda la parametrizacion se hace en `src/config/` **sin tocar componentes de
React**.

### `src/config/features.ts` — modificar features

Define las features disponibles: `id`, `label` (etiqueta), `formula`, si es
`required` (obligatoria, como `x`/`y`), `defaultEnabled`, `available` y la
funcion `compute`. Para agregar una feature nueva basta con anadir un objeto al
array `FEATURE_DEFINITIONS`.

### `src/config/training.ts` — hiperparametros, CV y preprocesamiento

Controla `optimizer`, `learningRate`, `momentum`, `loss`, `batchSize`
(`number | 'full'`, donde `'full'` = batch gradient descent), `maxEpochs`,
`preprocessing` (`'none' | 'normalize' | 'standardize'`) y `crossValidation`
(`enabled`, `folds`, `shuffle`, `seed`). El alumno no puede modificar nada de
esto desde la interfaz.

### `src/config/playground.ts` — limites de arquitectura y activaciones

Controla min/max de capas ocultas, min/max de neuronas y las activaciones
permitidas para las capas ocultas y para la salida. No define arquitectura
inicial: el alumno la construye sin valores predeterminados.

### Variables de entorno opcionales

Por defecto el batch size es `'full'` (batch gradient descent: batch = cantidad
de registros). Si el docente prefiere mini-batch, puede sobrescribirlo con la
variable de entorno de Vite `VITE_BATCH_SIZE`, sin tocar codigo:

- vacia o `full`  -> batch = cantidad de registros (por defecto)
- entero positivo (ej. `32`) -> mini-batch de ese tamano

El maximo de epocas se configura con `VITE_MAX_EPOCHS`:

- ausente o vacia -> `1000` (por defecto)
- entero positivo (ej. `2000`) -> ese maximo de epocas
- cualquier otro valor -> `1000`, con un aviso en la consola

La funcion de perdida es MSE por defecto. Para usar binary cross-entropy (BCE),
configure `VITE_LOSS=binaryCrossentropy`. Los valores `MSE` y `BCE` tambien se
aceptan sin distinguir mayusculas de minusculas.

El learning rate se configura con `VITE_LEARNING_RATE`. Debe ser un numero
positivo (por ejemplo, `0.001`); si falta o no es valido se usa `0.05`.

Copie `.env.example` a `.env` (local) y ajuste el valor:

```bash
cp .env.example .env
# .env
VITE_BATCH_SIZE=32
# Opcional; si se omite se usan 1000 epocas
VITE_MAX_EPOCHS=2000
# Opcional; MSE es el valor por defecto
VITE_LOSS=binaryCrossentropy
# Opcional; si se omite se usa 0.05
VITE_LEARNING_RATE=0.05
```

IMPORTANTE: en una SPA de Vite las variables de entorno se **inyectan en el
build**. Cambiar estas variables requiere reconstruir (`npm run build`) o
redeployar. En Vercel se configura en Project Settings → Environment Variables
(con esos nombres) y luego se hace redeploy. Solo se exponen variables
con prefijo `VITE_`; no coloque datos sensibles porque quedan embebidos en el
bundle.

---

## 10. Hiperparametros actualmente configurados

```text
optimizer:        SGD
learning rate:    0.05
                  (override con VITE_LEARNING_RATE)
momentum:         0.0
loss:             meanSquaredError (MSE; override con VITE_LOSS=binaryCrossentropy)
batch size:       'full'  (batch gradient descent; override con VITE_BATCH_SIZE)
max epochs:       1000 (override con VITE_MAX_EPOCHS)
preprocessing:    standardize (z-score por columna)
cross-validation: 5-fold (shuffle, seed 42)
```

El **conjunto de entrenamiento del modelo final es siempre el total de los
datos**; la generalizacion se estima con k-fold cross-validation (5 folds).

Limites de arquitectura:

```text
capas ocultas:    min 1, max 3   (sin arquitectura por defecto)
neuronas/capa:    min 1, max 32  (sin valor por defecto: lo elige el alumno)
activaciones:     ReLU, tanh, sigmoid (ocultas)
salida:           Dense(1); activacion a eleccion del alumno: sigmoid o tanh
```

> Nota sobre etiquetas: el entrenamiento usa **siempre** etiquetas internas
> `{0, 1}`. La representacion
> elegida por el alumno (`-1/+1` o `0/1`) solo afecta como se muestran las
> etiquetas en graficos y metricas.

---

## 11. Como funciona TensorFlow.js aqui

- El modelo se construye dinamicamente segun la arquitectura del alumno
  (`src/lib/tensorflow.ts`) y se compila con la configuracion docente.
- El entrenamiento corre **epoch por epoch** (`src/lib/trainingEngine.ts`) para
  poder actualizar el grafico de loss en tiempo real y permitir
  pausar/reanudar/detener sin bloquear la interfaz.
- Luego del modelo final se ejecuta **k-fold cross-validation**, salvo que el
  modelo alcance accuracy 1.0 (en ese caso ejecuta una epoca adicional y luego
  finaliza)
  (`src/lib/crossValidation.ts`): k modelos independientes entrenados sobre
  subconjuntos, cuyas metricas de validacion se promedian (media ± desvio). Los
  folds se entrenan en bloques cediendo el hilo para no congelar la interfaz.
- **Manejo de memoria**: se usan `tf.tidy`, `model.dispose()`,
  `optimizer.dispose()` (el `model.dispose()` no libera el optimizador) y
  `tensor.dispose()`. Al reiniciar el experimento se liberan modelo, optimizador
  y tensores, permitiendo muchos experimentos consecutivos sin crecimiento de
  memoria.
- La frontera de decision se calcula prediciendo sobre un grid del plano `x/y`,
  aplicando las mismas features y el mismo preprocesamiento aprendido.

---

## 12. Privacidad

Esta aplicacion **no envia ningun dato del alumno fuera de su navegador**.

- No existe backend.
- No existe base de datos.
- No existe autenticacion ni cuentas de usuario.
- No existe analytics, tracking ni telemetria (ni Google Analytics, Sentry,
  Hotjar, PostHog, etc.).
- No se almacenan experimentos (no se usa `localStorage`, IndexedDB ni cookies).
- No se envian datasets, configuraciones ni resultados.
- No se hacen requests `POST`/`PUT`/`PATCH`, WebSockets ni llamadas a APIs
  externas.
- Los unicos recursos solicitados son los assets estaticos de la propia app y
  `/data.csv` desde el mismo deploy.

El estado del experimento vive **solo en memoria** (Zustand) mientras la pagina
esta abierta. El boton **Reiniciar experimento** limpia todo el estado, detiene
el entrenamiento y libera la memoria de TensorFlow.js.

---

## 13. Estructura del proyecto

```text
public/
  data.csv                # dataset (docente)
src/
  components/             # UI por etapa (DataView, FeatureSelector, ...)
  config/                 # configuracion docente (features, training, playground)
  hooks/                  # useDataset, useTraining, useExperiment
  lib/                    # dataset, featureEngineering, preprocessing, metrics,
                          # tensorflow, trainingEngine, decisionBoundary, architecture
  store/                  # experimentStore (Zustand)
  types/                  # dataset, model, training
  App.tsx, main.tsx, theme.ts
```

---

## 14. Limitaciones tecnicas conocidas

- El bundle es grande (TensorFlow.js + Plotly). Se separa en chunks para mejorar
  el cacheo, pero la primera carga descarga varios MB.
- El entrenamiento usa el backend disponible del navegador (WebGL si esta
  disponible; CPU en su defecto), por lo que la velocidad depende del equipo del
  alumno.
- La frontera de decision se dibuja con resolucion fija (60x60) por rendimiento.
- Tras **detener** un entrenamiento, si el alumno cambia features/arquitectura
  los resultados mostrados siguen correspondiendo al ultimo modelo entrenado
  hasta que vuelva a entrenar o reinicie.
