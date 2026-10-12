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
