# Yiya Accounts — Reglas del proyecto

Plataforma para negocios de **alquiler de perfiles de cuentas de streaming**. El detalle de
cada tema está en `docs/` ([índice](docs/README.md)); acá solo lo que no se puede olvidar.

## Antes de trabajar, leer lo que corresponde

| Si vas a… | Lee |
|---|---|
| Tocar el dominio (cuentas, perfiles, alquileres…) | [docs/negocio/](docs/negocio/) — sobre todo [modelo](docs/negocio/modelo.md) y [hoja de ruta](docs/negocio/hoja-de-ruta.md) |
| Diseñar o tocar UI | [docs/diseno/](docs/diseno/) **y** `~/own/saas/front/DESIGN_SYSTEM.md` **y** la skill `emil-design-eng` |
| Escribir código de API, base o front | [docs/tecnico/convenciones.md](docs/tecnico/convenciones.md) |
| Desplegar | [docs/tecnico/despliegue.md](docs/tecnico/despliegue.md) |

## Reglas que no se negocian

- **Stack decidido (2026-10-11), no reabrir:** Hono + Drizzle + better-auth en Workers + D1,
  Vite + React en Pages. Ver [stack](docs/tecnico/stack.md).
- **Cada negocio ve solo sus datos.** El negocio sale de la sesión (`requireBusiness`),
  nunca del body ni de la URL.
- **Errores en español y entendibles**, nunca inglés ni texto de librerías.
- **UI como en el saas:** sombras en vez de bordes marcados, react-select para listas que
  crecen, listados con tabla en escritorio y card de listado en celular. «Como en el saas»
  = abrir el componente del saas y copiarlo tal cual.
- Dinero en céntimos enteros. Contraseñas de cuentas cifradas. Migraciones solo con
  `drizzle-kit generate`.
- **Thony corre todos los comandos.** Claude escribe el código y dice qué correr, aclarando
  qué no está verificado.

## Dónde va cada acuerdo nuevo

En el documento de su tema, con fecha: negocio → `docs/negocio/`, diseño → `docs/diseno/`,
código o infraestructura → `docs/tecnico/`. Si no existe el documento, se crea en su
carpeta y se agrega al [índice](docs/README.md). Nunca en un archivo general.
