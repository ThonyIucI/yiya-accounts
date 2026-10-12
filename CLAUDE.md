# Yiya Accounts — Reglas del proyecto

Plataforma para negocios de **alquiler de perfiles de cuentas de streaming** (Netflix,
Disney+…). Controla el inventario de cuentas compradas a proveedores, el estado de cada
perfil (libre / alquilado), a qué cliente final se alquiló, vencimientos y márgenes.

## Stack (decidido 2026-10-11, no reabrir)

Mismo stack y flujo de deploy que `~/own/amautas/electrolitos`, del que se copió la base:

- Monorepo pnpm: `apps/web` (Vite + React 19 + TanStack Router + Tailwind v4 + shadcn) y
  `apps/server` (Hono + Drizzle + better-auth). Paquetes `@yiya/{shared,db,auth,env,ui,config}`.
- **Cloudflare Workers + D1** (API `streaming-api.gaiamundo.com`) y **Pages** (web
  `streaming.gaiamundo.com`). Todo free tier, misma cuenta que electrolitos.
- Sin Nest, sin repositorios abstractos, sin CQRS. Ruta → handler → query Drizzle.
- El backend Nest/TypeORM de 2023 quedó en GitHub con el tag `legacy-nest`. No se porta
  código de ahí: solo sirve de referencia del dominio.

## Multi-negocio (como `stores` en id-backend)

- Cada negocio ve **solo** sus datos. Toda tabla del negocio lleva `businessId`.
- El negocio sale **de la sesión** (middleware), nunca del body ni de la URL.
- Una sola D1 para todos los negocios.
- Rol de plataforma en `user.role`: `SUPERADMIN` (Thony: da de alta negocios y dueños) o
  `USER`. El rol dentro del negocio (dueño / ayudante) va en la membresía.
- No hay registro público: el superadmin crea los negocios.
- Catálogo de servicios (Netflix, Disney+…) **global**; cada negocio pone sus precios.

## Dominio

```
Negocio ──< Proveedor ──< Cuenta ──< Perfil >── Alquiler >── Cliente final
                            │                      │
                     Servicio (global)           Combo
```

- **Cuenta**: correo + contraseña de la plataforma, `purchasePrice`, fechas de compra y
  vencimiento. La contraseña va **cifrada** en la base (AES-GCM con un secret), nunca plana.
- **Perfil**: unidad que se alquila (`pin`, nombre, precio, disponible).
- **Cliente final**: quien alquila. Es un registro, no hace login.
- **Regla central:** al crear un alquiler sus perfiles pasan a no disponibles; al liberarlo
  vuelven a disponibles. Escrituras multi-fila en `db.batch([...])`.
- Precios en **céntimos enteros** (integer), nunca float.

## Reglas de código

Las de electrolitos (`~/own/amautas/CLAUDE.md`), que aplican igual:
- Un archivo de rutas por recurso en `apps/server/src/routes/<recurso>.ts`; handlers cortos.
- Validación con `zod` (`@hono/zod-validator`). Salida `{ success, data, error }`.
- Esquema Drizzle en `packages/db/src/schema/<tabla>.ts`; migraciones **solo** con
  `drizzle-kit generate`, nunca SQL a mano. Aplicar con `wrangler d1 migrations apply`.
- **Todo error que ve la persona va en español y se entiende**: dice qué pasó y, si se
  puede, qué hacer. Nunca inglés, IDs, códigos ni texto de librerías. Cómo se garantiza:
  - better-auth: `lib/auth-errors.ts` traduce sus respuestas por `code` (agregar ahí los
    códigos nuevos que aparezcan, p. ej. al sumar un plugin).
  - Validación: usar siempre `validateJson` (`lib/validator.ts`), nunca `zValidator` directo.
    Cada campo de un esquema lleva su mensaje; lo que no, sale con `z.locales.es()`.
  - Cualquier otro error inesperado: el genérico «Ocurrió un error inesperado…» de `index.ts`.
  - En el front, los mensajes de respaldo de `lib/api.ts` y los `toast` también en español.

## Comandos

Thony corre todos los comandos (install, tests, build, migraciones, deploy). Claude escribe
código y dice qué correr. Ver `README.md` y `docs/despliegue.md`.

## Pendientes conocidos

- Identidad visual propia: `packages/ui/src/styles/globals.css` trae los tokens de electrolitos.
- Logo e íconos PWA (`pwaAssets` desactivado en `apps/web/vite.config.ts`).
