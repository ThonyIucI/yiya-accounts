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
- El estado también va en texto («Activo / Desactivado») cuando no hay un control que lo
  muestre. Si la fila ya tiene su switch, no se repite (ver «No repetir lo que ya se ve»).
- Acciones de fila con `RowActions` (`common/components/row-actions.tsx`).
- Referencia en Yiya: `apps/web/src/modules/businesses`.

## Menú lateral (acordado 2026-10-12, `components/app-sidebar.tsx`)

Como el de id-pos. **Complementa** la barra inferior, que se queda para todos como acceso
rápido. Por ahora **solo lo tiene el superadmin**; el dueño lo tendrá cuando haya opciones
que lo justifiquen.

- **Arriba:** nombre del usuario y, debajo, el select del negocio. Siempre hay uno elegido
  (por defecto, el primero de la lista); solo falta cuando no existe ningún negocio.
- **Luego:** los módulos.
- **Al pie:** salir.
- **En celular**, un panel que se abre desde el borde. **En escritorio**, fijo a la
  izquierda.

## Listados largos: buscador y paginado (acordado 2026-10-12)

Copiados del catálogo de cultivos del saas (`admin-config/crop-types`). Referencia en Yiya:
`routes/_app/servicios.tsx`.

- Buscador (`SearchInput`) dentro de `StickyToolbar`: al bajar se pega bajo el encabezado y
  se vuelve vidrio con sombra.
- `ResultsCounter` («Mostrando 1–10 de 24») arriba de la lista.
- `ListPagination` con filas por página (10, 20, 50): dentro de la card de la tabla en
  escritorio, en su propia barra con sombra en celular.
- Paginado en el front con `usePagination` mientras la lista sea chica.

## Datos editables en la fila (acordado 2026-10-12)

- Un dato que se cambia seguido, como un precio, se edita **ahí mismo** en la card o en la
  fila, sin abrir una modal, y **solo mientras el registro está activo**: desactivado, los
  campos se ocultan (`modules/services/components/price-field.tsx`).
- Se guarda **con debounce** al dejar de escribir; al salir del campo o con Enter, en el
  momento. Con Escape se descarta. El error queda debajo y, al salir, el campo vuelve al
  valor guardado.
- Activar con el switch abre una modal con esos campos (ya llenos si había datos) y recién
  al confirmar activa (`activate-service-modal.tsx`).
- **No repetir lo que ya se ve** (acordado 2026-10-12): si el switch ya dice si está activo,
  no va además un texto «Activo/Inactivo»; si los campos vacíos ya dicen que falta el
  precio, no va un aviso. La regla de «estado también en texto» de Listados vale solo donde
  no hay un control que lo muestre.

## Modal (`common/components/modal.tsx`)

- Hoja inferior en celular, tarjeta centrada en escritorio. Una sola superficie.
- **Encabezado = solo el título.** La descripción va dentro del cuerpo y se desplaza con el
  scroll, así con el teclado abierto el campo conserva alto.
- **El pie siempre lleva sombra hacia arriba**, haya scroll o no (como el saas). El
  encabezado se sombrea solo cuando el cuerpo bajó. Ninguno lleva borde.
- Con el teclado abierto, la hoja queda pegada encima del teclado
  (`interactive-widget=resizes-content` en `index.html`).
- Confirmaciones con `ConfirmModal`, nunca `window.confirm`.
- El scroll de la página se congela **solo** con una modal abierta, con
  `lockPageScroll` (lleva la cuenta si hay dos). Los menús (`DropdownMenu`) van con
  `modal={false}` y no lo tocan: su bloqueo se trababa al cambiar el zoom (2026-10-12).

## Campos de formulario

- Todos miden lo mismo: 52 px de alto (`h-13`), texto de 18 px.
- **Select** (`common/components/select.tsx`, react-select como el saas) para todo lo que
  crece: usuarios, clientes, cuentas. Se puede buscar escribiendo.
  - Opciones en **una sola línea**: «**Nombre** · dato secundario», no el dato debajo.
  - El `<select>` nativo solo para listas cortas y fijas.
- Validación con mensajes en español debajo del campo (`FieldError`).
