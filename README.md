# Yiya Accounts

Plataforma para negocios de **alquiler de perfiles de cuentas de streaming** (Netflix,
Disney+…): inventario de cuentas, perfiles libres/alquilados, clientes y vencimientos.
Multi-negocio: cada negocio ve solo sus datos.

| | Local | Producción |
|---|---|---|
| Front | http://localhost:3010 | https://streaming.gaiamundo.com |
| API | http://localhost:3011 | https://streaming-api.gaiamundo.com |

Puertos distintos a electrolitos (3008/3009) para poder correr los dos a la vez.

## Stack

| Parte | Tecnología | Dónde corre |
|---|---|---|
| `apps/web` | Vite + React 19 + TanStack Router + Tailwind v4 + shadcn | Cloudflare Pages |
| `apps/server` | Hono + Drizzle + better-auth | Cloudflare Workers |
| Base de datos | Cloudflare D1 (SQLite) | Cloudflare |
| `packages/shared` | Enums, tipos de API y utilidades compartidas back/front | — |
| `packages/db` | Schema Drizzle + migraciones generadas | — |
| `packages/auth` | Configuración de better-auth | — |
| `packages/ui` | Primitivas shadcn compartidas y `globals.css` (tokens) | — |

Requiere **Node 24** (`nvm use 24`) y **pnpm 12**.

## Levantar en local

```bash
nvm use 24
pnpm install
cp apps/server/.dev.vars.example apps/server/.dev.vars
pnpm db:generate           # solo si cambió el schema (genera SQL en packages/db/src/migrations)
pnpm db:migrate:local      # crea/actualiza las tablas de la base local. Idempotente
pnpm dev                   # front 3010 · API 3011
```

Crear tu usuario (superadmin) en la base local:

```bash
curl -X POST localhost:3011/api/v1/internal/seed-superadmin \
  -H "x-seed-token: seed-local-dev-token" -H "content-type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123","name":"Thony"}'
```

Y entras en http://localhost:3010/login.

## Comandos

| Qué | Comando |
|---|---|
| Front + API | `pnpm dev` |
| Tests de la API | `pnpm test` |
| Tipos | `pnpm check-types` |
| Generar migración | `pnpm db:generate` |
| Migrar local / producción | `pnpm db:migrate:local` / `pnpm db:migrate:remote` |
| Deploy API / front | `pnpm deploy:server` / `pnpm deploy:web` |

## Más

- [docs/despliegue.md](docs/despliegue.md) — primera vez en Cloudflare y cada deploy.
- [docs/usuarios.md](docs/usuarios.md) — roles y cómo dar acceso a un cliente.
- [docs/reemplazo-del-stack.md](docs/reemplazo-del-stack.md) — por qué se dejó Nest/Next y dónde quedó.
