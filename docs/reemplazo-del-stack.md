# Reemplazo del stack (2026-10)

## Qué cambió

| | Antes (2023) | Ahora |
|---|---|---|
| API | NestJS 9 + TypeORM | Hono + Drizzle + better-auth |
| Base | PostgreSQL en Docker | Cloudflare D1 (SQLite) |
| Front | Next 13.4 (solo placeholder) | Vite + React 19 + TanStack Router |
| Hosting | ninguno | Cloudflare Workers + Pages, plan gratis |
| Repos | `backend/` y `frontend/` separados | un solo monorepo en la raíz |

## Por qué

- **Deploy gratis y simple.** Nest + Postgres no corre en Workers: habría que pagar o usar
  un servidor gratis que se duerme. El stack nuevo se publica con `pnpm deploy:*`.
- **Mismo flujo que electrolitos.** Una sola forma de desarrollar y desplegar todos los
  proyectos, en la misma cuenta de Cloudflare.
- **Poco que perder.** El backend era CRUD sin login, y el front no tenía pantallas.
- **Deuda que no valía la pena arrastrar:** contraseñas en texto plano, precios en float,
  dependencias de 2023, y sin multi-negocio.
- Los datos de Postgres eran de prueba: no se migró nada.

## Cómo se hizo

La base del monorepo se copió de `~/own/amautas/electrolitos`, sin su lógica de talleres.
Se reusa el mismo repo de GitHub (`ThonyIucI/yiya-accounts`):

```bash
# 1. Guardar el backend viejo en un tag
cd ~/own/yiya-accounts/backend
git add -A && git commit -m "chore: last state before rebuild"
git tag legacy-nest && git push origin master --tags

# 2. El repo pasa a la raíz y se borra lo viejo
cd ~/own/yiya-accounts
mv backend/.git .git
rm -rf backend frontend      # frontend no tenía remote; era el placeholder de Next

# 3. Publicar el stack nuevo
git add -A && git commit -m "feat: rebuild on Hono + D1 + Vite stack"
git push
```

## Ver el código viejo

```bash
git show legacy-nest:src/modules/rentals/rentals.service.ts   # un archivo
git worktree add ../yiya-legacy legacy-nest                   # todo, en otra carpeta
git worktree remove ../yiya-legacy                            # quitar esa carpeta después
```

Sirve solo de referencia del dominio: no se porta código de ahí.
