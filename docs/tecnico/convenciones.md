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
- Una sola D1 para todos los negocios.
- Rol de plataforma en `user.role` (`SUPERADMIN` / `USER`); rol dentro del negocio en
  `membership.role` (`OWNER` / `HELPER`). Un usuario, un negocio (índice único).

## Base de datos

- Esquema en `packages/db/src/schema/<tabla>.ts`.
- Migraciones **solo** con `pnpm db:generate`, nunca SQL a mano. Se aplican con wrangler
  (ver [despliegue](despliegue.md)).
- Escrituras de varias filas en `db.batch([...])`.
- Dinero en céntimos enteros. Contraseñas de cuentas cifradas con AES-GCM y un secret.

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

## Quién corre qué

Thony corre todos los comandos (install, tests, build, migraciones, deploy, git). Claude
escribe el código y dice qué correr.
