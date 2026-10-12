# Diseño: componentes y patrones

Cómo se usa cada pieza. Los principios generales están en [principios](principios.md).

## Listados (acordado 2026-10-12)

Mismo patrón que el saas (`~/own/saas/front/src/modules/admin-config/crop-types`). Nada
de cards genéricas.

- **Escritorio:** tabla (`@yiya/ui/components/table`, `hidden md:block`).
- **Celular:** card de listado (`md:hidden`):
  - identidad arriba a la izquierda (ícono + nombre + dato secundario);
  - switch + menú de acciones arriba a la derecha;
  - detalles abajo.
- `PageHeader`: título, contadores («3 negocios · 2 activos») y la acción «Crear».
- `EmptyState`: ícono, título y la acción para salir del vacío («Crear el primero»).
- Skeletons con la forma de la fila o de la card, no un spinner.
- El estado también va en texto («Activo / Desactivado»), no solo con el switch.
- Acciones de fila con `RowActions` (`common/components/row-actions.tsx`).
- Referencia en Yiya: `apps/web/src/modules/businesses`.

## Modal (`common/components/modal.tsx`)

- Hoja inferior en celular, tarjeta centrada en escritorio. Una sola superficie.
- **Encabezado = solo el título.** La descripción va dentro del cuerpo y se desplaza con el
  scroll, así con el teclado abierto el campo conserva alto.
- **El pie siempre lleva sombra hacia arriba**, haya scroll o no (como el saas). El
  encabezado se sombrea solo cuando el cuerpo bajó. Ninguno lleva borde.
- Con el teclado abierto, la hoja queda pegada encima del teclado
  (`interactive-widget=resizes-content` en `index.html`).
- Confirmaciones con `ConfirmModal`, nunca `window.confirm`.

## Campos de formulario

- Todos miden lo mismo: 52 px de alto (`h-13`), texto de 18 px.
- **Select** (`common/components/select.tsx`, react-select como el saas) para todo lo que
  crece: usuarios, clientes, cuentas. Se puede buscar escribiendo.
  - Opciones en **una sola línea**: «**Nombre** · dato secundario», no el dato debajo.
  - El `<select>` nativo solo para listas cortas y fijas.
- Validación con mensajes en español debajo del campo (`FieldError`).
