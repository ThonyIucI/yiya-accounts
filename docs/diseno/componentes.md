# Diseño: componentes y patrones

Cómo se usa cada pieza. Los principios generales están en [principios](principios.md).

## Listados (acordado 2026-10-12)

Mismo patrón que el saas (`~/own/saas/front/src/modules/admin-config/crop-types`). Nada
de cards genéricas.

- **Escritorio:** tabla (`@yiya/ui/components/table`, `hidden md:block`).
- **Celular:** card de listado (`md:hidden`):
  - identidad arriba a la izquierda (ícono + nombre + dato secundario);
  - switch + menú de acciones arriba a la derecha;
  - detalles abajo. La card separa **cabecera y cuerpo con fondos distintos** (`bg-muted`
    arriba, blanco abajo; acordado 2026-10-22). Una nota libre va con el ícono `MessageSquareText` a la izquierda,
    para que se lea como nota y no como otro dato (acordado 2026-10-13).
- `PageHeader`: título, contadores («3 negocios · 2 activos») y la acción «Crear».
- `EmptyState`: ícono, título y la acción para salir del vacío («Crear el primero»).
- Skeletons con la forma de la fila o de la card, no un spinner.
- El estado también va en texto («Activo / Desactivado») cuando no hay un control que lo
  muestre. Si la fila ya tiene su switch, no se repite (ver «No repetir lo que ya se ve»).
- Acciones de fila con `RowActions` (`common/components/row-actions.tsx`).
- Referencia en Yiya: `apps/web/src/modules/businesses`.

## Menú lateral (acordado 2026-10-12, `components/app-sidebar.tsx`)

Como el de id-pos. **Complementa** la barra inferior, que se queda para todos como acceso
rápido con los módulos del negocio. Negocios y Usuarios van **solo en el menú lateral**, que
tiene más espacio: con seis botones la barra inferior no entra en un celular (acordado
2026-10-13). Por ahora **solo lo tiene el superadmin**; el dueño lo tendrá cuando haya opciones
que lo justifiquen.

- **Arriba:** nombre del usuario y, debajo, el select del negocio. Siempre hay uno elegido
  (por defecto, el primero de la lista); solo falta cuando no existe ningún negocio.
- **Luego:** los módulos.
- **Submenús** (acordado 2026-10-13, `components/sidebar-nav.tsx`): los módulos que van
  juntos se agrupan. Hoy: Panel · Servicios · **Compras** (Proveedores, Cuentas) ·
  Negocios · Usuarios. El grupo se abre solo si se está en uno de sus módulos, y se puede
  cerrar. La barra inferior **no** lleva grupos: sigue plana, como acceso rápido. La
  estructura está en `sidebarEntriesForRole` (`common/constants/routes.ts`).
- **Al pie:** salir.
- **En celular**, un panel que se abre desde el borde. **En escritorio**, fijo a la
  izquierda.

## Listados largos: buscador, filtros y paginado (acordado 2026-10-12)

Copiados del catálogo de cultivos del saas (`admin-config/crop-types`). Referencia en Yiya:
`routes/_app/servicios.tsx`.

- Buscador (`SearchInput`) dentro de `StickyToolbar`: al bajar se pega bajo el encabezado y
  se vuelve vidrio con sombra.
- **Filtros en su botón, no en la pantalla** (acordado 2026-10-13, como en id-pos): al lado
  del buscador va `FilterButton` (`common/components/filter-button.tsx`), con un globo que
  dice cuántos hay puestos. Abre una modal con los selects; se aplican al elegir y el botón
  dice cuántos resultados quedan («Ver 3 cuentas»), con «Limpiar» al lado. Referencia:
  `modules/accounts/components/account-filters-modal.tsx`.
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

## Detalle lateral (acordado 2026-10-13, `common/components/side-panel.tsx`)

Como el detalle de cliente de id-pos. Referencia en Yiya: el detalle de una cuenta
(`modules/accounts/components/account-detail-panel.tsx`).

- **En celular** ocupa la pantalla, con «‹ Volver» arriba. **En escritorio** es un panel a
  la derecha sobre la lista.
- Lo abierto va en la URL (`/cuentas?cuenta=<id>`): se puede recargar o compartir.
- El contenido va en cards con título (`DetailSection`, encabezado sobre fondo `bg-muted` y
  cuerpo en blanco, como id-pos) y filas **ícono + etiqueta: valor** (`DetailRow` dentro de
  `DetailList`), con sus botones (copiar, ver) al final de la fila.
- **Los valores van alineados** (acordado 2026-10-22): las filas comparten columnas
  (subgrid), así todos los valores arrancan en el mismo punto aunque las etiquetas midan
  distinto.
- **Lo que todavía no existe no se muestra** (p. ej. renovaciones, mientras no estén las
  compras): ni filas vacías ni datos inventados.
- Las acciones de todo el registro van en el `⋯` del encabezado.

## Copiar

- Cada dato que se le pasa a un cliente lleva su ícono de copiar, y copia **solo ese dato**.
- **Siempre con `CopyButton`** (`common/components/copy-button.tsx`, acordado 2026-10-13):
  al tocarlo pasa a **cargando**, luego a un **check** por 2 s y vuelve al ícono de copiar.
  No lleva toast de «Copiado» (el check ya lo dice); si falla, el error sí va en un toast.
- **«Copiar acceso»** de una cuenta (el ícono de copiar de su card y el `⋯` del detalle)
  copia el bloque listo para WhatsApp
  (`modules/accounts/utils/access-text.ts`):
  `📺 *CUENTA: NETFLIX*` / `📧 Correo: …` / `🔑 Contraseña: …`.

## Campos de formulario

- Todos miden lo mismo: 52 px de alto (`h-13`), texto de 14 px en escritorio y 16 px en celular (para que iOS no haga zoom, ver [principios](principios.md)).
- **Select** (`common/components/select.tsx`, react-select como el saas) para todo lo que
  crece: usuarios, clientes, cuentas. Se puede buscar escribiendo.
  - Opciones en **una sola línea**: «**Nombre** · dato secundario», no el dato debajo.
  - El `<select>` nativo solo para listas cortas y fijas.
- **Teléfono** (`common/components/phone-input.tsx`, acordado 2026-10-13): el `PhoneInput`
  de id-pos. A la izquierda, la bandera y el prefijo («+51»), que abren un buscador de
  países por nombre, ISO o prefijo; a la derecha, el número con el formato del país
  mientras se escribe y un celular de ejemplo como placeholder. Arranca en Perú.
- **Mostrar un teléfono** (`modules/providers/components/provider-phone.tsx`, acordado
  2026-10-13): bandera + el número **sin prefijo** («987 654 321»: la bandera ya dice el
  país). Al costado, copiar (copia el número completo, «+51987654321», con
  `common/utils/clipboard.ts`, que funciona también sin HTTPS, ver
  [convenciones](../tecnico/convenciones.md)) y el ícono de WhatsApp, pegado al de copiar. **Solo el ícono** abre el chat; el
  número no es link.
- **Un select de servicios lleva el logo de cada uno** (acordado 2026-10-13), en el menú y
  en lo elegido: `toServiceOption` (`modules/services/utils/service-option.tsx`). `IOption`
  acepta `icon` para eso.
- **Select con «Crear «…»»** (`CreatableSelect` de `common/components/select.tsx`): para
  agregar algo sin salir del formulario, como un proveedor desde la cuenta.
- Validación con mensajes en español debajo del campo (`FieldError`).
