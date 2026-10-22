# Diseño: principios

## Fuentes que mandan

Antes de diseñar o tocar UI, leer:

1. `~/own/saas/front/DESIGN_SYSTEM.md`: tokens, tipografía, accesibilidad, patrones.
2. La skill `emil-design-eng`: motion y detalles de interacción.
3. El componente equivalente del saas (`~/own/saas/front/src`). Cuando se acuerda «como en
   el saas», se copia ese comportamiento tal cual, sin reinterpretarlo.

## Superficies: sombras, no bordes (acordado 2026-10-12)

- Cards, tablas y modales se separan del fondo con **sombra suave**, nunca con bordes
  gruesos (`border-2`). Tokens en `packages/ui/src/styles/globals.css`:

  | Token | Uso |
  |---|---|
  | `shadow-card` | Cards y tablas en reposo |
  | `shadow-elevated` | Menús, selects abiertos, hover |
  | `shadow-sheet` | Modales y hojas inferiores |
  | `shadow-edge-top` / `shadow-edge-bottom` | Pie / encabezado de una modal |

- Dentro de una superficie se separa con **espacio**; como mucho, una línea fina
  `border-border/60`.
- Estado vacío: borde **punteado fino** (1 px), no grueso.

## Botones: nunca desactivados (acordado 2026-10-13)

- Un botón **nunca** lleva `disabled`, ni el de guardar, ni el de crear, ni los íconos de
  una fila. Si todavía no se puede hacer lo que pide, el clic **dice por qué** en español:
  el error del campo debajo, o un toast («Activa un servicio en Servicios para registrar
  cuentas.»).
- Mientras guarda, el botón sigue habilitado con su spinner, y un segundo clic no hace
  nada (la guarda va en el handler, p. ej. `if (form.state.isSubmitting) return`).
- Lo mismo vale para los switches: mientras guardan llevan `aria-busy`, no `disabled`.

## Tipografía y scroll (acordado 2026-10-22)

- **Texto normal: 14 px** (`text-sm`), en escritorio y en celular. Los títulos suben a 16 px
  (`text-base`) o más. No se usa 16 px para texto corriente.
- **Única excepción: los campos de texto en celular** (`text-base md:text-sm`): iOS hace
  zoom a la página al enfocar un campo con letra menor a 16 px.
- **Scrollbar como el del saas** (`apps/web/src/index.css`): oculta, y aparece fina al pasar
  el mouse por un elemento con scroll.

## Fondo y controles (acordado 2026-10-22)

- **La página tiene el mismo tono que la card**: blanca en claro y el azul de la card en
  oscuro (`--background` en `packages/ui/src/styles/globals.css`). Las cards se separan con
  su sombra y su cabecera en `bg-muted`.
- El switch mide 24 px de alto: discreto dentro de una card o una fila.

## Cursor (acordado 2026-10-22)

- En escritorio, **todo lo clickeable lleva manita** (`cursor: pointer`): botones, filas y
  cards que se abren, switches, ítems de menú, pestañas. Una regla global en
  `apps/web/src/index.css` cubre `button`, `a[href]` y los `role` de control; un `div` o
  `tr` clickeable debe llevar `role="button"` o `cursor-pointer`.

## Páginas de error (acordado 2026-10-22)

- `components/error-screen.tsx` es la forma común (card centrada: ícono, título, explicación
  y la salida). La **404** (`not-found.tsx`) y el **«Algo salió mal»** (`route-error.tsx`) la
  usan; están registradas en el router (`defaultNotFoundComponent`, `defaultErrorComponent`).

## Motion

- Curvas: `[0.23, 1, 0.32, 1]` para entrar; `[0.32, 0.72, 0, 1]` para hojas inferiores.
  Nunca `easeIn`.
- La salida siempre es más rápida que la entrada, y todo dura menos de 300 ms.
- Animar con `transform` en texto (`"translateY(8px)"`), no con `x`/`y`/`scale` sueltos.
- Respetar siempre `useReducedMotion()`.

## Pendiente

- Identidad visual propia: los colores y la tipografía de `globals.css` vienen de
  electrolitos.
- Logo e íconos PWA (`pwaAssets` desactivado en `apps/web/vite.config.ts`).
