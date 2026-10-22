# Convenciones de código

Las de electrolitos (`~/own/amautas/CLAUDE.md`) aplican igual. Lo propio de Yiya:

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

## Quién corre qué

Thony corre todos los comandos (install, tests, build, migraciones, deploy, git). Claude
escribe el código y dice qué correr.

## Herramientas de desarrollo (acordado 2026-10-22)

- **click-to-component** (`click-to-react-component-next`, solo en `pnpm dev`): Alt + clic
  sobre un elemento abre el archivo de su componente en el editor. Va cargado de forma
  perezosa en `routes/__root.tsx` y no entra al build de producción.
