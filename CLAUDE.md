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

## Listados en la web

Mismo patrón que el saas (`~/own/saas/front/src/modules/admin-config/crop-types`), nada de
cards genéricas:
- Escritorio: tabla (`@yiya/ui/components/table`, `hidden md:block`). Celular: cards
  (`md:hidden`) con identidad arriba a la izquierda, switch + `RowActions` arriba a la
  derecha y los detalles abajo tras un `border-t`.
- `PageHeader` (título + contadores + «Crear»), `EmptyState` con CTA, skeletons con la forma
  de la fila/card, estado en texto además del switch.
- Hooks de una acción (`use-list-x`, `use-create-x`, `use-update-x`); el de lista expone
  `onUpsert`. Referencia en Yiya: `apps/web/src/modules/businesses`.

## Superficies, selects y motion

Antes de tocar UI, leer `~/own/saas/front/DESIGN_SYSTEM.md` y la skill `emil-design-eng`.
- **Sombras, no bordes marcados.** Cards, tablas y modales se separan del fondo con
  `shadow-card` / `shadow-elevated` / `shadow-sheet` (tokens en `globals.css`), sin
  `border-2`. Dentro de una superficie, si hace falta separar: espacio, o como mucho una
  línea fina `border-border/60`.
- **Modal** (`common/components/modal.tsx`): una sola superficie. Encabezado = solo título
  (la descripción va en el cuerpo, para que con el teclado abierto el campo tenga alto).
  El pie **siempre** se separa con sombra hacia arriba (`shadow-edge-top`, como el saas);
  el encabezado, solo cuando hay scroll. Ninguno con borde.
- **Selects:** `common/components/select.tsx` (react-select, como el saas) para todo lo que
  crece (usuarios, clientes, cuentas). `<select>` nativo solo para listas cortas y fijas.
- **Motion:** curvas `[0.23, 1, 0.32, 1]` (entrar) y `[0.32, 0.72, 0, 1]` (hoja); nunca
  `easeIn`; salida más rápida que la entrada; < 300 ms; animar con `transform` en string
  (no `x`/`y`/`scale` sueltos); respetar `useReducedMotion()`.

## Comandos

Thony corre todos los comandos (install, tests, build, migraciones, deploy). Claude escribe
código y dice qué correr. Ver `README.md` y `docs/despliegue.md`.

## Pendientes conocidos

- Identidad visual propia: `packages/ui/src/styles/globals.css` trae los tokens de electrolitos.
- Logo e íconos PWA (`pwaAssets` desactivado en `apps/web/vite.config.ts`).
