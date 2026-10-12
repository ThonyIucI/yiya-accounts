# Despliegue

Todo vive en la **misma cuenta de Cloudflare que electrolitos** (la de `gaiamundo.com`), en
subdominios nuevos que no tocan nada existente:

| Pieza | Nombre en Cloudflare | URL |
|---|---|---|
| API (Worker) | `streaming-api` | https://streaming-api.gaiamundo.com |
| Front (Pages) | `yiya-streaming` | https://streaming.gaiamundo.com |
| Base (D1) | `streaming-db` | — |

Plan gratis. Los límites (100 000 peticiones/día, 500 MB por base…) se comparten con
electrolitos porque son por cuenta.

---

## Primera vez (una sola vez)

Todo desde la raíz del repo, con `wrangler login` ya hecho (lo hiciste para electrolitos;
`pnpm --filter server exec wrangler whoami` debe mostrar tu cuenta).

### 1. Crear la base

```bash
pnpm --filter server exec wrangler d1 create streaming-db
```

Copia el `database_id` que imprime y pégalo en `apps/server/wrangler.jsonc`, en lugar de
`PEGAR_AQUI_EL_DATABASE_ID`.

### 2. Secrets del Worker

```bash
# 64 caracteres aleatorios para firmar sesiones
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
pnpm --filter server exec wrangler secret put BETTER_AUTH_SECRET

# Un token largo inventado, para crear el superadmin de producción
pnpm --filter server exec wrangler secret put SEED_TOKEN
```

Nunca van en `wrangler.jsonc` ni en ningún archivo del repo.

### 3. Tablas + API

```bash
pnpm db:generate            # si todavía no hay migraciones en packages/db/src/migrations
pnpm db:migrate:remote
pnpm deploy:server
```

`wrangler.jsonc` ya trae la ruta `streaming-api.gaiamundo.com` como **custom domain**, así que
el deploy crea el DNS y el certificado solo. Comprueba:

```bash
curl -s https://streaming-api.gaiamundo.com/api/v1/health    # 200
```

### 4. Proyecto Pages + front

```bash
pnpm --filter web exec wrangler pages project create yiya-streaming --production-branch main
pnpm deploy:web
```

Si Cloudflare te asigna otro subdominio de `pages.dev` (porque `yiya-streaming` estaba tomado),
cámbialo en `CORS_ORIGIN` de `apps/server/wrangler.jsonc` y vuelve a correr `pnpm deploy:server`.

Luego, en el panel: **Workers & Pages** → `yiya-streaming` → **Custom domains** → **Set up a
custom domain** → `streaming.gaiamundo.com`. Cloudflare arma el DNS solo.

> Prueba el login en iPhone recién con `streaming.gaiamundo.com`: en `*.pages.dev` el front y
> la API quedan en dominios distintos y Safari bloquea la cookie de sesión.

### 5. Crear tu superadmin de producción

Con el `SEED_TOKEN` real del paso 2:

```bash
curl -X POST https://streaming-api.gaiamundo.com/api/v1/internal/seed-superadmin \
  -H "x-seed-token: $SEED_TOKEN" -H "content-type: application/json" \
  -d '{"email":"...","password":"...","name":"Thony"}'
```

Es idempotente: si ya existe, no crea otro.

---

## Cada despliegue

El orden importa: primero la base, después la API, después el front.

```bash
pnpm db:migrate:remote     # 1. solo si hubo migraciones nuevas
pnpm deploy:server         # 2. Worker
pnpm deploy:web            # 3. Pages
```

1. Si despliegas el código antes que la migración, la API consulta columnas que todavía no
   existen y devuelve «Ocurrió un error inesperado».
2. Si despliegas solo el front, la web nueva le habla a una API vieja y las rutas nuevas
   responden `404 Recurso no encontrado`, aunque la pantalla se vea bien.

## Verificar qué hay publicado

Una ruta que existe pero pide sesión responde **401**; una que no existe responde **404**:

```bash
curl -s https://streaming-api.gaiamundo.com/api/v1/health    # 200 siempre
curl -s https://streaming-api.gaiamundo.com/api/v1/me        # 401 si está al día
```

## Respaldo de la base

D1 guarda 7 días de historial (Time Travel) en el plan gratis. Antes de una migración que
borre o renombre columnas, además:

```bash
pnpm --filter server db:backup     # deja backup.sql
```

---

> Los scripts se llaman `deploy:worker` y `deploy:pages` dentro de cada app porque `deploy`
> es un comando propio de pnpm. Desde la raíz son `deploy:server` y `deploy:web`.
