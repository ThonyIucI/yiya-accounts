# ERS · Paso 2: Servicios y precios

| | |
|---|---|
| Estado | **Revisado con Thony** (2026-10-12, 3.ª vuelta): superadmin siempre dentro de un negocio, menú lateral solo para él y además de la barra inferior, dos precios en la card |
| Etapa | Paso 2 de la [hoja de ruta](../negocio/hoja-de-ruta.md) |
| Depende de | Paso 1, negocios y membresías (hecho en código) |
| Lo usa después | Paso 3 (cuentas y perfiles) y paso 4 (alquileres) |

## 1. Objetivo

- Que exista **un catálogo único de servicios** (Netflix, Disney+…), que mantiene el
  superadmin.
- Que **cada negocio** active los servicios que trabaja y les ponga sus dos precios: lo que
  le cuesta la cuenta y a cuánto vende cada perfil por mes.

Sin esto no se pueden registrar cuentas (paso 3) ni alquilar perfiles (paso 4).

## 2. Alcance

**Entra:**

- El catálogo global: el superadmin crea y edita servicios.
- **Entrar a un negocio:** el superadmin siempre está dentro de un negocio y lo cambia desde
  un select en un menú lateral, como en id-pos. El dueño siempre está en el suyo.
- **En el negocio en el que se está:** activar o desactivar servicios y poner el precio de
  compra y el precio de venta.
- El menú lateral, **solo para el superadmin** por ahora. La barra inferior se queda para
  todos como acceso rápido.
- Un catálogo inicial cargado con un seed.

**No entra (se ve después):**

| Qué | Cuándo |
|---|---|
| Promociones, y precios de 3, 6 y 12 meses | Paso 4, con los planes ([alquileres](../negocio/alquileres.md)) |
| Combos (varios servicios a un precio) | Después del paso 5 |
| Vender cuentas completas | **Nunca:** solo se venden perfiles (acordado 2026-10-12) |
| Sacar un servicio del catálogo | Cuando haga falta. Hoy un servicio que no se trabaja simplemente no se activa |
| Subir imágenes a la plataforma | No se hará: el servicio guarda un **link** a una imagen PNG |
| Historial de cambios de precio | No hace falta: cada alquiler guardará el precio con el que se vendió (paso 4) |
| Varias monedas | Todo en soles (S/) |

## 3. Actores

| Actor | Ve | Hace |
|---|---|---|
| Superadmin (Thony) | **Todo**: el catálogo y cualquier negocio | Crea y edita servicios. Dentro de un negocio, todo lo que hace el dueño |
| Dueño del negocio | Solo su negocio | Activa o desactiva servicios y pone sus precios |
| Ayudante | Nada todavía (sin pantallas, ver [modelo](../negocio/modelo.md)) | — |

## 4. Requisitos funcionales

### Entrar a un negocio

| ID | Requisito |
|---|---|
| RF-01 | El superadmin tiene un **menú lateral** que **complementa** la barra inferior, no la reemplaza. El dueño, por ahora, no lo tiene: le llegará cuando haya opciones que lo justifiquen. |
| RF-02 | El menú lateral muestra arriba el nombre del usuario y, debajo, un **select con todos los negocios**, que se puede buscar escribiendo (como id-pos: «Líder Comunidad» y el select «JUAREZ QA»). Al elegir uno, toda la app pasa a mostrar los datos de ese negocio. |
| RF-03 | **Siempre hay un negocio elegido.** Si el superadmin todavía no eligió ninguno, entra en el primero de la lista (el mismo orden de **Negocios**: el más reciente primero). |
| RF-04 | Solo cuando **no existe ningún negocio** el superadmin queda sin negocio: el select no aparece y en su lugar se ve «Todavía no hay negocios» → «Crear el primero». Ve solo el catálogo. |
| RF-05 | El negocio elegido se guarda **en el server, en el usuario** (no en el navegador ni en la sesión): sigue ahí al recargar, al volver a entrar y desde otro dispositivo. El server nunca lo toma del body ni de la URL. |
| RF-06 | El superadmin puede entrar también a un negocio desactivado, con un aviso «Este negocio está desactivado». |

### Catálogo global (superadmin)

| ID | Requisito |
|---|---|
| RF-07 | Solo el superadmin crea un servicio, con **nombre**, **perfiles por cuenta** y **link de imagen** (opcional). |
| RF-08 | Crear un servicio **no lo activa en ningún negocio**: queda en el catálogo hasta que se active dentro de un negocio. |
| RF-09 | No puede haber dos servicios con el mismo nombre, aunque cambien las mayúsculas o los espacios («netflix» = «Netflix »). |
| RF-10 | Solo el superadmin edita el nombre, los perfiles por cuenta y el link de imagen. El cambio se ve en todos los negocios. |

### Servicios dentro de un negocio (dueño, o superadmin dentro del negocio)

| ID | Requisito |
|---|---|
| RF-11 | `/servicios` lista **todo el catálogo**. Cada servicio dice si está activo **en ese negocio** y muestra sus precios. |
| RF-12 | **Solo con el servicio activo**, la card (o fila) muestra **dos campos de precio** editables ahí mismo: **precio de compra** (lo que le cuesta la cuenta al negocio) y **precio de venta por perfil al mes**. Desactivado, los campos se ocultan (acordado 2026-10-12). |
| RF-13 | Un precio se guarda solo al dejar de escribir (debounce de 0,7 s), y al salir del campo o con Enter se guarda en el momento. Solo si cambió y es válido. Si falla, el error aparece debajo del campo y se vuelve al valor anterior. |
| RF-14 | El switch activa o desactiva el servicio **solo en ese negocio**. |
| RF-15 | **Activar siempre pasa por una modal** con los dos precios (ya puestos si estaban guardados) y la ganancia en vivo; recién al confirmar se guardan y se activa. Desactivar es directo (acordado 2026-10-12). |
| RF-16 | No se puede vaciar un precio de un servicio activo. |
| RF-17 | Desactivar no borra los precios: al volver a activarlo, siguen ahí. |
| RF-18 | Con los dos precios, la card muestra lo que deja una cuenta llena: «Cuenta llena: S/ 37.50 · ganancia S/ 17.50» (perfiles × venta − compra). |
| RF-19 | Los cambios de precio valen para lo que se registre después. Lo ya alquilado no cambia. |
| RF-20 | El dueño no ve «Crear» ni «Editar». El superadmin sí, y además ve cuántos negocios tienen activo cada servicio. |

### Lista

| ID | Requisito |
|---|---|
| RF-21 | Buscador por nombre y **paginado** como el catálogo de cultivos del saas: «Mostrando 1–10 de 24», filas por página (10, 20, 50) y páginas. |
| RF-22 | Orden: primero los activos en el negocio, luego por nombre. El encabezado cuenta «10 servicios · 3 activos». |

### Datos iniciales

| ID | Requisito |
|---|---|
| RF-23 | Un seed carga el catálogo inicial, sin imágenes (los links se pegan después). Correrlo dos veces no duplica nada. |

Catálogo inicial propuesto (**a confirmar con el cliente**, sobre todo los perfiles que de
verdad vende por cuenta):

| Servicio | Perfiles por cuenta |
|---|---|
| Netflix | 5 |
| Disney+ | 7 |
| Max | 5 |
| Prime Video | 6 |
| Paramount+ | 6 |
| Crunchyroll | 4 |
| Spotify | 6 |
| YouTube Premium | 6 |
| Apple TV+ | 6 |
| ViX | 5 |

## 5. Reglas de negocio

1. **El catálogo es global; la activación y los precios son de cada negocio.**
2. **Solo se venden perfiles**, nunca cuentas completas.
3. **Dos precios por servicio y negocio:**

   | Precio | Qué es | Ejemplo |
   |---|---|---|
   | Compra | Lo que le cuesta **una cuenta** al negocio | S/ 20.00 |
   | Venta | A cuánto alquila **un perfil por un mes** | S/ 7.50 |

4. Los planes de 3, 6 y 12 meses y las promociones se agregan en el paso 4 encima del precio
   de venta mensual, sin reemplazarlo.
5. **Precios en soles con dos decimales** (acordado 2026-10-12). Se escriben, se guardan y
   se muestran igual: `7.50` → «S/ 7.50». El campo acepta «7.5» o «7,50».
6. Un precio válido es mayor a S/ 0 y tiene dos decimales como mucho.
7. **Perfiles por cuenta:** entero de 1 en adelante, **sin tope**. Es el valor por defecto
   para las cuentas del paso 3.
8. Nombre del servicio: de 2 a 40 caracteres, sin espacios al inicio ni al final.
9. **Imagen:** un link `https://` a un PNG que Thony aloja afuera. Es opcional; si falta o
   no carga, se muestra la inicial del nombre.

## 6. Modelo de datos

```
service (global)                  business_service (por negocio)
─────────────────                 ──────────────────────────────
id                                id
name           único sin mayúsc.  business_id     → business (cascade)
profiles_per_account  entero ≥ 1  service_id      → service  (restrict)
image_url      texto, opcional    is_active       default false
created_at                        purchase_price  real, opcional (soles, por cuenta)
updated_at                        profile_price   real, opcional (soles, perfil/mes)
                                  created_at
                                  updated_at
                                  único (business_id, service_id)

user (better-auth)
──────────────────
+ active_business_id  texto, opcional (solo lo usa el superadmin)
```

- `business_service` se crea la primera vez que alguien guarda un precio en ese negocio.
  Sin fila, el servicio está inactivo y sin precios.
- `is_active` solo puede ser `true` si `purchase_price` y `profile_price` existen. Lo valida
  el server.
- Los precios se redondean a 2 decimales al guardar. Las sumas (ganancia, paso 5) se
  redondean a 2 decimales al mostrarse.
- `service_id` usa `restrict`: un servicio con precios no se puede borrar.
- La unicidad del nombre va en una columna `name_key` (`toServiceNameKey`: sin mayúsculas
  ni espacios dobles o en los bordes) con índice único. Así el seed puede usar
  `onConflictDoNothing`.
- `active_business_id` va en `user` y no lo conoce better-auth: solo lo lee
  `requireBusiness` y solo lo cambia el endpoint de la sección 7. No lleva FK porque el
  esquema de negocios importa el de auth; si el negocio ya no existe, se cae al primero.
- Esquema en `packages/db/src/schema/services.ts`. Tipos y límites en
  `packages/shared/src/services.ts`. Utilidades de dinero en `packages/shared/src/money.ts`
  (`parseSoles` y `formatSoles`), para el front y el server.

## 7. API

Todo con el sobre `{ success, data, error }` y `validateJson`. Ver
[convenciones](../tecnico/convenciones.md).

### `requireBusiness` cambia

| Quién | De dónde sale el negocio |
|---|---|
| Dueño | De su membresía (como hoy). Si el negocio está desactivado → 403 |
| Superadmin | De `user.activeBusinessId`. Si está vacío, o ese negocio ya no existe, toma el primero de la lista y lo guarda. Si no hay ningún negocio → 403 «Todavía no hay negocios. Crea el primero en Negocios.». Puede estar desactivado |

`c.var.business` gana `isActive`, y `role` pasa a `OWNER | SUPERADMIN` para saber quién
entró.

### Rutas

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `PUT /api/v1/me/active-business` | superadmin | Elige `{ businessId }`. Lo guarda en su usuario |
| `GET /api/v1/my-business` | con negocio | El negocio en el que se está (ya existe; ahora también para el superadmin) |
| `GET /api/v1/services` | superadmin | El catálogo, con `activeInCount` (en cuántos negocios está activo) |
| `POST /api/v1/services` | superadmin | Crea `{ name, profilesPerAccount, imageUrl? }` → 201 |
| `PATCH /api/v1/services/:id` | superadmin | Cambia `{ name?, profilesPerAccount?, imageUrl? }` |
| `GET /api/v1/business-services` | con negocio | Todo el catálogo con `{ isActive, purchasePrice, profilePrice }` del negocio |
| `PATCH /api/v1/business-services/:serviceId` | con negocio | Cambia `{ isActive?, purchasePrice?, profilePrice? }` y crea la fila si no existe |

El select de negocios del superadmin usa `GET /api/v1/businesses`, que ya existe.

El catálogo es chico, así que la paginación y la búsqueda se hacen en el front, como en el
saas (`usePagination`). Si algún día pasa de unos cientos de servicios, se pasan al server
con `{ data, meta: { total, limit, offset } }`, el mismo formato del saas.

### Errores (todos en español)

| Caso | Status | Mensaje |
|---|---|---|
| Superadmin sin ningún negocio creado | 403 | «Todavía no hay negocios. Crea el primero en Negocios.» |
| Negocio elegido inexistente | 404 | «No encontramos ese negocio.» |
| Nombre repetido | 409 | «Ya existe el servicio «Netflix».» |
| Servicio inexistente | 404 | «No encontramos ese servicio.» |
| Activar sin los dos precios | 400 | «Pon el precio de compra y el de venta antes de activarlo.» |
| Vaciar un precio de un servicio activo | 400 | «Un servicio activo necesita sus dos precios.» |
| Precio en 0 o negativo | 400 | «El precio debe ser mayor a S/ 0.» |
| Precio con más de 2 decimales | 400 | «El precio solo puede tener hasta 2 decimales.» |
| Perfiles menor a 1 o con decimales | 400 | «Los perfiles por cuenta deben ser un número entero desde 1.» |
| Link que no es `https://` | 400 | «El link de la imagen debe empezar con https://.» |
| PATCH vacío | 400 | «No hay cambios para guardar.» |
| Dueño intenta tocar el catálogo | 403 | El mensaje de `requireSuperadmin` |

## 8. Pantallas

Siguen [diseño](../diseno/).

### Menú lateral (solo superadmin, además de la barra inferior)

Como el de id-pos:

- **Arriba:** el nombre del usuario.
- **Debajo:** el `Select` (react-select) de negocios, con el elegido siempre puesto. Si no
  hay negocios, «Todavía no hay negocios» → «Crear el primero».
- **Luego:** los módulos (Panel, Servicios, Negocios, Usuarios).
- **Al pie:** salir.
- **En celular** es un panel que se abre desde el borde (la pestaña `‹`). **En escritorio**
  queda fijo a la izquierda.

La **barra inferior** sigue igual para todos, como acceso rápido, y gana **Servicios**. El
dueño no tiene menú lateral por ahora.

### `/servicios`

Copia el catálogo de cultivos del saas (`~/own/saas/front/src/modules/admin-config/crop-types`):

- encabezado como isla;
- barra pegajosa con el buscador (`StickyToolbar`);
- `ResultsCounter` y `ListPagination`: dentro de la tabla en escritorio, en una barra
  propia en celular;
- sombras, no bordes.

**Card de celular** (referencia: productos de id-pos):

- **Arriba:** imagen, nombre y «5 perfiles por cuenta» a la izquierda; a la derecha el
  switch y `⋯` con «Editar» (solo el superadmin). Es el mismo orden que la card de Negocios.
- **Medio, lado a lado (solo si está activo):** «Compra (cuenta)» y «Venta (perfil/mes)», con prefijo `S/` y
  teclado decimal (`inputMode="decimal"`).
- **Pie:** «Cuenta llena: S/ 37.50 · ganancia S/ 17.50» y, para el superadmin, «Activo en N
  negocios». Sin nada que mostrar, no hay pie. El estado lo dice el switch: sin texto
  «Activo/Inactivo» ni aviso de precios faltantes (acordado 2026-10-12, eran redundantes).

**Tabla de escritorio:** Servicio · Perfiles · Compra · Venta · Ganancia por cuenta · Activo ·
acciones. Los precios son campos editables en la celda.

**Qué cambia por rol:**

| | Superadmin | Superadmin, sin ningún negocio creado | Dueño |
|---|---|---|---|
| Botón «Crear» | Sí | Sí | No |
| «Editar» en `⋯` | Sí | Sí | No |
| Switch y precios | Sí, del negocio elegido | No: aviso «Crea un negocio para activar servicios y poner precios.» | Sí, de su negocio |
| «Activo en N negocios» | Sí | Sí | No |

**Modal crear / editar servicio (superadmin):**

- Nombre.
- Perfiles por cuenta (numérico).
- Link de imagen, con una vista previa al lado que cae a la inicial si el link no carga.

**Estados vacíos:**

- Catálogo vacío (superadmin): «Todavía no hay servicios» → «Crear el primero».
- Catálogo vacío (dueño): «Todavía no hay servicios en el catálogo. Pídeselo a quien te dio
  el acceso.».
- Búsqueda sin resultados: «Sin resultados para "…"».

## 9. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Aislamiento: ningún endpoint de negocio acepta `businessId` en el body ni en la URL. El del superadmin sale de lo que guardó el server. |
| RNF-02 | Todo mensaje visible en español y entendible. |
| RNF-03 | Cada lista se arma en una sola consulta (join), sin N+1. |
| RNF-04 | Las pantallas se usan cómodas en celular, que es donde trabaja el cliente. |
| RNF-05 | Migración generada con `pnpm db:generate`, nunca SQL a mano. |

## 10. Criterios de aceptación (tests)

En `apps/server/test/active-business.spec.ts`, `services.spec.ts` y
`business-services.spec.ts`:

**Entrar a un negocio**

- [ ] El superadmin que nunca eligió negocio entra en el primero de la lista.
- [ ] La elección sigue al volver a iniciar sesión.
- [ ] Sin ningún negocio creado, `/business-services` da 403 con el mensaje.
- [ ] El superadmin elige el negocio A y ve sus datos; cambia al B y ve los de B.
- [ ] El superadmin entra a un negocio desactivado.
- [ ] El dueño recibe 403 en `/me/active-business`.

**Catálogo**

- [ ] El superadmin crea un servicio con imagen y 12 perfiles → 201, inactivo en todos los
      negocios.
- [ ] Nombre repetido con otras mayúsculas o espacios → 409 con el mensaje.
- [ ] Perfiles en 0, perfiles con decimales, link `http://` y nombre corto → 400 en español.
- [ ] El dueño recibe 403 al crear o editar servicios.

**Servicios del negocio**

- [ ] El dueño ve todo el catálogo, inactivo y sin precios al principio.
- [ ] Activar sin los dos precios → 400.
- [ ] Guardar compra `20` y venta `7.5`, y activar → `GET` devuelve `20`, `7.5` e
      `isActive: true`.
- [ ] Vaciar un precio de un servicio activo → 400.
- [ ] El precio `7.555` → 400.
- [ ] Desactivar conserva los precios.
- [ ] Lo del negocio A no aparece en el negocio B.
- [ ] El superadmin dentro del negocio A cambia un precio, y el dueño de A lo ve.
- [ ] `activeInCount` cuenta solo los negocios donde está activo.

**Otros**

- [ ] `parseSoles`: «7» → 7, «7,5» → 7.5, «7.555» → error, «0» → error.
- [ ] El seed corrido dos veces no duplica servicios.

## 11. Al terminar

- Pasar los acuerdos a [negocio/](../negocio/): un `servicios-y-precios.md`, y actualizar
  [modelo](../negocio/modelo.md) y [negocios y usuarios](../negocio/negocios-y-usuarios.md).
- Pasar a [convenciones](../tecnico/convenciones.md) cómo sale el negocio del superadmin.
- Pasar a [componentes](../diseno/componentes.md) el menú lateral, el paginado y los precios
  editables en la card.
- Marcar el paso 2 en la [hoja de ruta](../negocio/hoja-de-ruta.md).
- Comandos (los corre Thony): `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm test`,
  `pnpm check-types`; en producción, `pnpm db:migrate:remote`, el seed del catálogo y los
  deploys.

## 12. Por confirmar con el cliente

1. ¿El catálogo inicial está bien? ¿Falta alguno (por ejemplo, IPTV o Canva)?
2. ¿Cuántos perfiles **vende** de verdad por cuenta de cada servicio? A veces se deja uno
   libre para el dueño de la cuenta.
3. ~~¿El precio de compra cambia según el proveedor?~~ Resuelto el 2026-10-12: sí. Cada
   cuenta guarda su precio real y el de acá queda como **referencial**
   ([paso 3](03-inventario.md)).
