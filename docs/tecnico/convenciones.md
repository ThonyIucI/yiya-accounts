# Convenciones de código

Reglas copiadas de `~/own/saas/planning/rules.md` (Frontend y General) y de
`~/idbi/id-backend/docs/RULES-DEV-GUIDELINES.md` (General, Frontend, Alcance) el
2026-10-30, adaptadas al stack de Yiya. **Las que están acá son las que valen**: no hace
falta abrir esos archivos, y lo que de ahí no está acá no aplica (Nest, MikroORM, Laravel,
yup, react-hook-form, `idbi-components`).

## Código TS/React (acordado 2026-10-30)

### Nombres y tipos

- **Interfaces `IFoo`, types `TFoo`, enums `EFoo`.** Nunca un `type` con `I` ni una
  `interface` con `T`.
- **Una forma que se repite se declara una vez**, como interface base, y las demás la
  extienden (`IServiceResource extends IServiceSummary`). `Pick` / `Omit` solo cuando no se
  pueda extender. Nunca la misma forma escrita suelta en dos lugares.
- Opciones de dominio fijas (estados de una entidad): enum con su objeto de labels.
  ```ts
  export enum EFooStatus { ACTIVE = "ACTIVE", INACTIVE = "INACTIVE" }
  export const fooStatusLabels: Record<EFooStatus, string> = { … };
  export type TFooStatus = `${EFooStatus}`;
  ```
  Variantes de la UI (tono, tamaño de un componente) van como union `TFoo`.
- Sin `any` ni `unknown`, salvo datos de afuera que se validan después. El tipado se deja
  inferir cuando es obvio: legibilidad antes que sobre-tipar.
- **Nombres en inglés y camelCase**; constantes en `UPPER_SNAKE_CASE`; booleanos con `is`,
  `has`, `should`, `can`. Los textos que ve la persona, en español.
- **Sin abreviaciones ni monosílabos**: `items.map((option) => option.id)`, nunca
  `(o) => o.id`; `catch (error)`, nunca `catch (e)`.

### Funciones

- Arrow functions para todo lo que no es componente. Los componentes son
  `export default function Nombre()` (así está todo el front).
- Una arrow con 2 o más sentencias va en varias líneas, nunca en una.
- **Parámetros:** hasta 2, posicionales; 3 o más, un solo objeto desestructurado.
- **No incrustar llamadas como argumento:** el resultado va primero a una variable con
  nombre y después se pasa. El código se lee línea por línea.
- Sin valores sueltos: rutas, límites, tiempos y tipos van en constantes con nombre.
- JSDoc en utils y hooks que no se entienden por el nombre; los hooks del CRUD no lo
  necesitan.

### Archivos e imports

- Un componente por archivo, en **kebab-case** (`provider-card.tsx`).
- `export default` para componentes; sin barrels: se importa del archivo directo.
- Lo que se repite en dos módulos va a `common/` (componentes, hooks, utils).

### Hooks y estado

- Hooks de petición instanciados como objeto: `const ListProviders = useListProviders()`
  → `ListProviders.data`, `.handler`, `.loading`.
- Sin `useState` aparte para un listado: el `data` del hook, con `onUpsert(item)` y
  `onRemove(id)` para actualizar al toque, sin volver a pedir.
- Las peticiones se disparan desde el componente de la pantalla, no con un `useEffect`
  dentro del hook. Nada de `useEffect` para encadenar peticiones.
- Flags de abrir/cerrar con `useBoolean`, no `useState<boolean>`.
- Mínimo de `useEffect`, `useMemo` y `useCallback`: mejor un callback que diga el evento
  (`onEntered`). `useCallback` solo si la función es dependencia de un efecto o va a un
  hijo con `React.memo`.

### Pantallas

- **Skeleton mientras carga**, con la forma del contenido final: nunca el estado vacío
  mientras la petición sigue. Los contadores y subtítulos que salen de datos remotos
  también (`PageHeader` con `isLoadingSubtitle`, `ResultsCounter`).
- Toda mutación muestra que está cargando, avisa el error (lo hace `useRequest`) y
  sincroniza la lista sin recargar.
- **Toda acción destructiva pide confirmación** en modal (`ConfirmModal`), con la opción
  del menú en rojo.
- El texto de un botón nunca se parte en dos líneas: si no entra, se ajusta el layout.
- Búsqueda en el front mientras la lista sea acotada (menos de ~500); en el server, con
  debounce de 300 ms, cuando crece sin límite.
- Fechas siempre con `dayjs` y el locale de `APP_LOCALE` (`common/utils/format-date.ts`).
- Animaciones con `motion/react` y `AnimatePresence`, respetando `useReducedMotion()`.
- Para enfocar un campo al abrir una modal, nunca `autoFocus` (en el celular sube el
  teclado en medio de la animación).

Lo que en esas guías choca con un acuerdo de Yiya **no se copió**: el submit deshabilitado
por `loading` (acá ningún botón se desactiva) y el tamaño mínimo de texto (acá la base es
14 px y los badges y avisos van en 12 px). Ver [principios](../diseno/principios.md).

### Alcance de los cambios

1. **Solo se toca lo que se pidió.** Describir cómo debería comportarse algo no es una
   orden de hacerlo: se responde qué implicaría y se sigue con lo que se estaba haciendo.
2. **Si el mensaje trae preguntas, primero se responden** y se propone cómo se va a hacer;
   se codea cuando Thony lo aprueba (acordado 2026-10-30).
3. **Antes de tocar un flujo, se recorre entero**: una validación nueva en una capa puede
   sobrar o romper algo si otra capa ya resuelve el caso.

---

Lo que sigue es propio de Yiya.

## API

- Un archivo de rutas por recurso en `apps/server/src/routes/<recurso>.ts`; handlers cortos.
- Toda respuesta con el sobre `{ success, data, error }` (`lib/response.ts`).
- Validación con zod usando **siempre** `validateJson` (`lib/validator.ts`), nunca
  `zValidator` directo.

## Multi-negocio en el código

- Toda tabla con datos de un negocio lleva `businessId`.
- Las rutas del negocio usan `requireAuth, requireBusiness` y filtran por
  `c.var.business.id`. El negocio **nunca** sale del body ni de la URL.
- De dónde lo saca `requireBusiness` (acordado 2026-10-12):
  - **dueño:** de su membresía, y solo si el negocio está activo;
  - **superadmin:** de `user.activeBusinessId`, que elige en su menú lateral
    (`PUT /me/active-business`). Si nunca eligió o ese negocio ya no existe, entra en el
    primero de la lista (`lib/business-order.ts`). Puede entrar a uno desactivado.
- `c.var.business.role` es `OWNER`, `HELPER` o `SUPERADMIN`: dice con qué rol se entró.
- En el front, `useActiveBusiness().version` sube al cambiar de negocio y `_app` vuelve a
  montar la pantalla con esa `key`. Así cada pantalla pide sus datos sin escuchar el cambio.
- Una sola D1 para todos los negocios.
- Rol de plataforma en `user.role` (`SUPERADMIN` / `USER`); rol dentro del negocio en
  `membership.role` (`OWNER` / `HELPER`). Un usuario, un negocio (índice único).

## Base de datos

- Esquema en `packages/db/src/schema/<tabla>.ts`.
- **Tablas en plural** (acordado 2026-10-30): `customers`, `providers`. Solo las
  intermedias van en singular (`business_service`). Las tablas de antes de este acuerdo
  siguen en singular; pasarlas a plural es una migración aparte, que se renombra conservando
  los datos (anotada en los refactors pendientes de la
  [hoja de ruta](../negocio/hoja-de-ruta.md)).
- Migraciones **solo** con `pnpm db:generate`, nunca SQL a mano. Se aplican con wrangler
  (ver [despliegue](despliegue.md)).
- Escrituras de varias filas en `db.batch([...])`.
- Dinero en soles: columna `real`, validada con hasta 2 decimales y redondeada a 2 al
  guardar y al sumar. Se convierte con `parseSoles` / `formatSoles` de `@yiya/shared`
  (acordado 2026-10-12).
- **Contraseñas de cuentas** (acordado 2026-10-13): AES-GCM de 256 bits con Web Crypto y
  un IV por contraseña (`apps/server/src/lib/account-password.ts`), con la llave del secret
  `ACCOUNT_PASSWORD_KEY`. Se guarda «v1:iv:cifrado»: el `v1` permite cambiar de llave
  sin perder las viejas. En claro solo sale por `GET /accounts/:id/password`; nunca en
  listados, logs ni errores.
- **D1 acepta como mucho 100 parámetros por consulta**: nada de `inArray(ids)` con listas
  que crecen ni inserts de muchas filas en uno. Filtrar por negocio, o un insert por fila
  dentro de `db.batch`.
- **Nombres únicos** (servicios, proveedores): columna `name_key` con índice único, porque
  el índice de SQLite distingue mayúsculas y su `lower()` no entiende tildes.
- **Teléfonos** (acordado 2026-10-13): dos columnas, `country_prefix` («51», sin «+»; nunca
  `country_code`, que es el ISO «PE») y el número en dígitos. En la API,
  `{ countryPrefix, number }`. Validar y formatear solo con `@yiya/shared/phones`
  (`libphonenumber-js`).
- **Fechas sin hora** (acordado 2026-10-13, código 2026-10-22): las compras guardan días
  como texto «2026-10-22» (`purchased_on`, `expires_on`), que se comparan bien como texto.
  «Hoy» es el de Perú (`todayInLima`) y los meses se suman con `addMonths` (31 ene + 1 mes =
  28 feb), los dos de `@yiya/shared/dates`. Nunca `new Date("2026-10-22")` para mostrar:
  lo lee en UTC y en Perú sale un día antes.
- Al pedir `pnpm db:generate`, decir qué crea o cambia cada migración y para qué (como la
  tabla «Migraciones» de cada ERS), no solo el comando.

## Errores en español (acordado 2026-10-12)

Todo error que ve la persona va en español y se entiende: dice qué pasó y, si se puede, qué
hacer. Nunca inglés, IDs, códigos ni texto de librerías.

| Origen | Dónde se traduce |
|---|---|
| better-auth | `lib/auth-errors.ts`, por `code`. Agregar ahí los códigos nuevos |
| Validación | Mensaje propio en cada campo del esquema; lo demás con `z.locales.es()` |
| Errores de Hono e inesperados | Mensaje genérico por status en `index.ts` |
| Front | Respaldos de `lib/api.ts` y todos los `toast` |

## Front

- Módulos en `apps/web/src/modules/<recurso>/{services,hooks,components}`.
- Un hook por acción (`use-list-x`, `use-create-x`, `use-update-x`); el de lista expone
  `onUpsert`. Los toasts de éxito van en el hook; los de error, en `useRequest`.
- **Copiar al portapapeles** (acordado 2026-10-13): siempre con `copyToClipboard` de
  `common/utils/clipboard.ts`, nunca `navigator.clipboard` directo. Esa API solo existe en
  HTTPS: al probar `pnpm dev` desde el celular por la IP (`http://192.168…`) no está, y el
  botón fallaba. El util prueba la API y, si no está, copia seleccionando el texto
  (`execCommand("copy")` sobre un `<span>`, para que el iPhone no abra el teclado). Avisa
  con un toast en los dos casos.
- **Copiar algo que viene del server** (la contraseña, el acceso): se le pasa la
  **promesa** a `copyToClipboard` / `CopyButton`, no el texto ya esperado. En iPhone, copiar
  después de esperar la red pierde el permiso del toque; con la promesa, el pedido de
  copia sale en el mismo toque (`ClipboardItem`).
- **Pulsación larga** (`useLongPressCopy`, 2026-10-22): copia **al soltar** (`pointerup`),
  no al cumplirse el tiempo. El navegador solo deja escribir en el portapapeles durante un
  gesto del usuario, y el `setTimeout` de la pulsación no cuenta como gesto. Con mouse no
  hace nada.
- **Variantes con cva** (2026-10-22): una función de variantes que se usa suelta en un
  `className` (p. ej. `iconButtonVariants` en un enlace o en el disparador de un menú)
  debe devolver el resultado pasado por `cn`. Si no, quedan clases que chocan
  (`border-transparent` y `border-border`) y gana la que Tailwind escriba después: así el
  `⋯` de la tabla salía sin borde.

## Quién corre qué

Thony corre todos los comandos (install, tests, build, migraciones, deploy, git). Claude
escribe el código y dice qué correr.

## Herramientas de desarrollo (acordado 2026-10-22)

- **code-inspector-plugin** (solo en `pnpm dev`, cambiado 2026-10-21): mantener Alt + Shift
  y hacer clic sobre un elemento abre el archivo de su componente en el editor. Es un plugin
  de Vite (`vite.config.ts`) que marca el HTML al compilar. Reemplaza a
  `click-to-react-component-next`, que no funciona con React 19 (React quitó `_debugSource`
  y la librería entra en recursión infinita) y no entra al build de producción.
