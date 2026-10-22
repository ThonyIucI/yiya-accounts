# ERS · Paso 3: Inventario (proveedores, cuentas y perfiles)

| | |
|---|---|
| Estado | **Proveedores, cuentas y perfiles hechos en código** (2026-10-13). **Compras y renovaciones hechas en código** (2026-10-22); faltan su migración, probar y desplegar |
| Etapa | Paso 3 de la [hoja de ruta](../negocio/hoja-de-ruta.md) |
| Depende de | Paso 2, servicios y precios (hecho en código) |
| Lo usa después | Paso 4 (alquileres) y paso 5 (panel) |

## 1. Objetivo

Que cada negocio registre **qué cuentas tiene, a quién se las compró, cada compra o
renovación con su costo y su vencimiento, y qué perfiles tiene cada una**. Sobre esto se
alquilan los perfiles en el paso 4.

## 2. Alcance

**Entra:**

- **Proveedores:** la agenda del negocio, con crear, editar y eliminar.
- **Cuentas:** se registran con su servicio, su proveedor y sus credenciales. Se activan y
  desactivan con un switch.
- **Compras de la cuenta:** cada compra o renovación con el proveedor, con su precio y su
  vencimiento. Van **aparte de la cuenta** (acordado 2026-10-13): la cuenta existe aunque
  no se esté alquilando, puede quedar en espera y volver a usarse.
- **Perfiles:** se crean solos al registrar la cuenta y se editan dentro de ella.
- Ver la contraseña de una cuenta con el ícono del ojo.

**No entra (se ve después):**

| Qué | Cuándo |
|---|---|
| Alquilar perfiles, y el estado libre / alquilado | Paso 4. Hasta entonces todos los perfiles están libres |
| El margen (lo cobrado en alquileres menos lo pagado en compras) | Paso 5 (panel) |
| Avisos de vencimiento | Paso 5 (panel) y después por WhatsApp |
| Desactivar un proveedor | Cuando haga falta. Hoy se elimina si no tiene cuentas |
| Precios de compra por proveedor (lista de precios) | No hace falta: cada cuenta guarda lo que costó |

## 3. Actores

| Actor | Hace |
|---|---|
| Dueño del negocio | Todo lo de este paso, solo en su negocio |
| Superadmin | Lo mismo, dentro del negocio elegido en su menú lateral |
| Ayudante | Nada todavía (sin pantallas) |

## 4. Requisitos funcionales

### Proveedores

| ID | Requisito |
|---|---|
| RF-01 | Un proveedor tiene **nombre** (obligatorio), **WhatsApp** y **nota** (opcionales). El WhatsApp usa el campo de teléfono de id-pos: bandera y prefijo con buscador de países, y el número con el formato del país mientras se escribe (acordado 2026-10-13). |
| RF-02 | No puede haber dos proveedores con el mismo nombre en un negocio, aunque cambien las mayúsculas o los espacios. En dos negocios distintos, sí. |
| RF-03 | Un proveedor vende **cualquier cantidad de servicios**, y un servicio se compra a **cualquier cantidad de proveedores**. No hay que decir de antemano qué vende cada uno: sale de sus cuentas (acordado 2026-10-12). |
| RF-04 | El listado muestra nombre, WhatsApp (con link a `wa.me`) y nota, con buscador (nombre, número o nota) y paginado. Cuántas cuentas tiene se agrega con las cuentas. |
| RF-05 | **Se puede eliminar solo si no tiene cuentas** (acordado 2026-10-12). Si tiene, en vez de la confirmación se ve «No puedes eliminar a «Juan»: tiene 3 cuentas. Cámbiales el proveedor o elimínalas primero.». El server lo valida igual. |

### Cuentas

| ID | Requisito |
|---|---|
| RF-06 | Una cuenta tiene: **servicio**, **proveedor**, **correo**, **contraseña** y **nota** (opcional). Siempre entra con correo (acordado 2026-10-13), y se valida que lo sea. |
| RF-07 | Solo se registran cuentas de servicios **activos en el negocio**. Si no hay ninguno: «Activa un servicio en Servicios para registrar cuentas.» → «Ir a Servicios». |
| RF-08 | Al registrar la cuenta se registra **su primera compra** en el mismo formulario (sección siguiente). No hay cuenta sin compra. |
| RF-09 | **Switch de activa** (acordado 2026-10-13): una cuenta desactivada (se cayó, se dejó de usar) sigue en la lista con sus datos, pero sus perfiles no se podrán alquilar (paso 4). Nace activa. El switch dice el estado: **sin badge** «Activa». |
| RF-10 | No puede haber dos cuentas del mismo servicio con el mismo correo en un negocio («Ya tienes una cuenta de Netflix con ese correo.»). |
| RF-11 | Todo se edita después, **menos el servicio**: los perfiles dependen de él. Si se equivocó de servicio, elimina la cuenta y la registra de nuevo. |
| RF-12 | Eliminar una cuenta elimina sus perfiles y sus compras, con confirmación. Desde el paso 4, no se podrá si tiene perfiles alquilados. |
| RF-13 | El listado muestra servicio (imagen y nombre), correo, proveedor, perfiles (el vencimiento de la última compra se mostrará cuando existan las compras). Ordenado por vencimiento, la que vence antes primero; las desactivadas al final. |
| RF-14 | Estados del vencimiento (rehecho 2026-10-22): **vencida** (rojo) si ya pasó; **vence hoy** (naranja); **por vencer** (amarillo) si faltan **menos de 3 días** (1 o 2); si no, **al día**. Los tres colores pasan 4.5:1 de contraste. Cómo se ve en cada pantalla, en la sección 8. |
| RF-15 | Buscador por correo y filtros por servicio y por proveedor (react-select). Paginado como en Servicios. |

### Compras y renovaciones de la cuenta

| ID | Requisito |
|---|---|
| RF-15a | Una compra tiene **precio**, **fecha de compra** y **vencimiento**. La primera se registra con la cuenta; cada renovación con el proveedor es **una compra nueva** de la misma cuenta («Renovar»). |
| RF-15b | **El precio es el de esa compra**: lo que se pagó esa vez. El campo viene lleno con el **precio referencial** del servicio en el negocio y se puede cambiar. Al renovar, viene con el de la compra anterior (acordado 2026-10-12 y 2026-10-13). |
| RF-15c | La fecha de compra viene con hoy (al renovar, con el vencimiento anterior) y el vencimiento con un mes después. Se pueden cambiar. El vencimiento no puede ser antes de la compra. |
| RF-15d | El detalle de la cuenta muestra **sus compras**, de la más nueva a la más vieja, con lo pagado en total. Una compra mal cargada se edita o se elimina; la única que queda no se elimina. |
| RF-15e | **Cuentas anteriores a las compras** (2026-10-22): las registradas antes no tienen ninguna. No se inventan: dicen «Sin compras», van al final del orden por vencimiento y «Renovar» les registra la primera (con el referencial y hoy). |

### Contraseña

| ID | Requisito |
|---|---|
| RF-16 | En la base, la contraseña **se guarda cifrada**. En la pantalla, **se muestra** (acordado 2026-10-12). |
| RF-17 | La contraseña se ve **solo en el detalle** de la cuenta (acordado 2026-10-13). Por defecto oculta (`••••••••`); el ícono del ojo la muestra y vuelve a ocultarla. |
| RF-18 | En el detalle, el correo lleva al lado su ícono de copiar (copia **solo el correo**), y la contraseña, debajo, el suyo (copia **solo la contraseña**). |
| RF-18a | En las opciones principales del detalle (`⋯`), **«Copiar acceso»** copia la cuenta lista para pegar en WhatsApp (los `*` son negrita en WhatsApp):<br>`📺 *CUENTA: NETFLIX*`<br>`📧 Correo: cuenta@gmail.com`<br>`🔑 Contraseña: ••••`<br>El nombre del servicio va en mayúsculas. |
| RF-19 | En el formulario de editar, la contraseña viene llena (oculta, con su ojo). Si no se toca, no cambia. |

### Perfiles

| ID | Requisito |
|---|---|
| RF-20 | Al registrar la cuenta se crean solos sus perfiles: tantos como **perfiles por cuenta** tenga el servicio. El número se puede cambiar en el formulario, solo al crear. |
| RF-21 | Se llaman «P1», «P2»… en la card y «Perfil 1», «Perfil 2»… en el detalle. Cada uno tiene **nombre** y **PIN** (opcional, **4 dígitos**, acordado 2026-10-13). |
| RF-22 | El nombre y el PIN se editan **ahí mismo** en el detalle de la cuenta, con debounce, como los precios en Servicios. El PIN se ve tal cual (no es la contraseña). |
| RF-23 | Se puede **agregar** un perfil a la cuenta y **eliminar** uno, con confirmación. Una cuenta siempre tiene al menos un perfil. |
| RF-24 | Los perfiles no llevan precio: se venden al precio de venta del servicio, y el alquiler guardará el suyo (paso 4). |

## 5. Reglas de negocio

1. **Proveedor y servicio se relacionan a través de la cuenta**, no por una lista aparte:
   «¿a quién le compro Netflix?» y «¿qué me vende Juan?» salen de las cuentas.
2. **Precio de compra:**

   | Dónde | Qué es |
   |---|---|
   | Servicio del negocio (paso 2) | **Referencial**: el valor con el que se llena el campo |
   | Compra de la cuenta | **El real**: lo que costó esa compra o renovación. De acá sale el margen (paso 5) |

   Cambiar el referencial no cambia las compras ya registradas.
2b. **Cuenta, compra y alquiler son cosas distintas** (acordado 2026-10-13): la cuenta es
   el acceso (correo y contraseña); la compra, cada vez que se le pagó al proveedor; el
   alquiler (paso 4), cada vez que se le cobra a un cliente por un perfil. Una cuenta puede
   tener compras y ningún alquiler.
3. Dinero en soles con dos decimales, igual que en el paso 2 (`parseSoles`).
4. Las fechas son días (sin hora), en hora de Perú. «Hoy» y «vencida» se calculan con
   `America/Lima`.
5. La contraseña **nunca** se guarda en texto plano, nunca va en logs y no viene en el
   listado: se pide aparte al tocar el ojo o copiar (sección 7).

## 6. Modelo de datos

```
provider                          streaming_account
────────                          ─────────────────
id                                id
business_id  → business (cascade) business_id   → business (cascade)
name                              service_id    → service  (restrict)
name_key     único por negocio    provider_id   → provider (restrict)
country_prefix texto, opcional    email
phone        texto, opcional      email_key     único (business_id, service_id, email_key)
note         texto, opcional      password_encrypted   «v1:iv:cifrado» en base64
created_at                        is_active     default true
updated_at                        note          texto, opcional
                                  created_at
                                  updated_at

account_purchase                  profile
────────────────                  ───────
id                                id
business_id  → business (cascade) business_id  → business (cascade)
account_id   → streaming_account   account_id   → streaming_account
price        real (soles)         name
purchased_on texto «2026-10-13»   pin          texto, opcional (4 dígitos)
expires_on   texto «2026-11-13»   position     entero (orden en la cuenta)
created_at                        created_at
updated_at                        updated_at
```

- **`name_key`** (en `provider`, como ya está en `service`): el nombre sin mayúsculas ni
  espacios de más, con un índice único. Sirve para que la **base** no deje guardar
  «Juan Pérez» y «juan pérez » como dos proveedores, aunque lleguen dos pedidos a la vez. No
  alcanza con un índice sobre `name`: en SQLite distingue mayúsculas, y `lower()` y
  `NOCASE` no entienden tildes («ÁNGEL» ≠ «ángel»). Se calcula en el server con
  `toProviderNameKey`.
- **Teléfono** como en id-pos, en dos columnas: `country_prefix` («51», sin «+») y `phone`
  (solo dígitos). En id-pos el prefijo se llama `country_code`; acá **`country_prefix`**,
  porque *country code* es el ISO del país («PE»), no el «+51» (acordado 2026-10-13). En
  la API viaja como `phone: { countryPrefix, number } | null`. Se valida contra el país con
  `libphonenumber-js` (`packages/shared/src/phones.ts`), en el front y en el server.
- `provider_id` con `restrict`: la base tampoco deja borrar un proveedor con cuentas.
- `profile` lleva `business_id` aunque se pueda sacar de la cuenta: toda tabla con datos de
  un negocio lo lleva ([convenciones](../tecnico/convenciones.md)), y el paso 4 filtra
  perfiles por negocio sin join.
- `email_key` = el correo sin mayúsculas ni espacios en los bordes, por lo mismo que
  `name_key`.
- **El vencimiento de la cuenta** es el `expires_on` de su última compra: no se copia a
  `account`, así no hay dos fechas que puedan no coincidir. El listado lo saca con un
  `max()` agrupado, en la misma consulta.
- **Cifrado:** AES-GCM de 256 bits con Web Crypto, IV aleatorio por contraseña. La llave es
  el secret `ACCOUNT_PASSWORD_KEY` (32 bytes en base64): en producción con
  `wrangler secret put`, en local en `apps/server/.dev.vars`. El prefijo `v1` permite
  cambiar de llave más adelante sin perder las viejas. Código en
  `apps/server/src/lib/account-password.ts`.
- Esquemas en `packages/db/src/schema/{providers,accounts}.ts`. Tipos y límites en
  `packages/shared/src/{providers,accounts}.ts`.

### Migraciones (qué crea cada una y para qué)

| Migración | Cambio | Para qué |
|---|---|---|
| Proveedores | Tabla `provider` | La agenda de proveedores de cada negocio |
| | `business_id` → `business` con `cascade` | Cada proveedor es de un negocio; si se borra el negocio, se van sus proveedores |
| | `name_key` + índice único (`business_id`, `name_key`) | Que no haya dos proveedores con el mismo nombre en un negocio. Empieza por `business_id`, así también sirve para listar los de un negocio |
| | `country_prefix` y `phone` | El WhatsApp: prefijo del país y número en dígitos |
| | `note` | Lo que el dueño quiera recordar («vende Netflix y Max») |
| Cuentas | Tabla `streaming_account` (no `account`: ese nombre ya es de better-auth, 2026-10-13) | Cada cuenta de streaming del negocio: el acceso |
| | `service_id` → `service` con `restrict` | De qué servicio es. No se puede borrar un servicio que tiene cuentas |
| | `provider_id` → `provider` con `restrict` | A quién se le compró. No se puede borrar un proveedor que tiene cuentas (RF-05) |
| | `email_key` + índice único (`business_id`, `service_id`, `email_key`) | Que no se registre dos veces la misma cuenta de Netflix. Empieza por `business_id`, así también sirve para listar |
| | `password_encrypted` | La contraseña cifrada; en claro nunca se guarda |
| | `is_active` | El switch de activa |
| | Índice en `provider_id` | Contar rápido las cuentas de un proveedor (el listado y el bloqueo al eliminar) |
| Compras (2026-10-22, su propia migración) | Tabla `account_purchase` | Cada compra o renovación con el proveedor, con su precio y sus fechas |
| | `business_id` → `business` con `cascade` | Cada compra es de un negocio; si se borra el negocio, se van |
| | `account_id` → `streaming_account` con `cascade` | Si se elimina la cuenta, se van sus compras |
| | Índice (`account_id`, `expires_on`) | Sacar rápido el vencimiento de la última compra de cada cuenta |
| | Índice en `business_id` | Traer las compras de todo el negocio en una consulta, para el listado |
| | Sin datos para las cuentas que ya existen | No se inventan compras: esas cuentas dicen «Sin compras» (RF-15e) |
| Perfiles | Tabla `profile` | Los perfiles de cada cuenta |
| | `account_id` → `streaming_account` con `cascade` | Si se elimina la cuenta, se van sus perfiles |
| | Índice (`account_id`, `position`) | Listar los perfiles de una cuenta en orden |

## 7. API

Todo con `requireAuth, requireBusiness` y filtrado por `c.var.business.id`. Un id de otro
negocio responde 404, como si no existiera.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/v1/providers` | Proveedores del negocio, con `accountCount` |
| `POST /api/v1/providers` | Crea `{ name, phone?, note? }` → 201 |
| `PATCH /api/v1/providers/:id` | Cambia `{ name?, phone?, note? }` |
| `DELETE /api/v1/providers/:id` | Elimina. Con cuentas → 409 |
| `GET /api/v1/accounts` | Cuentas con servicio, proveedor, perfiles y `purchases` (la más nueva primero; el vencimiento es el `expiresOn` más lejano, `accountExpiresOn`). **Sin contraseña** |
| `POST /api/v1/accounts` | Crea `{ serviceId, providerId, email, password, note?, profileCount, purchase: { price, purchasedOn, expiresOn } }`: la cuenta, su primera compra y sus perfiles en un `db.batch` → 201 |
| `GET /api/v1/accounts/:id` | Una cuenta con sus perfiles y sus compras. Sin contraseña |
| `GET /api/v1/accounts/:id/password` | `{ password }` descifrada. La piden el ojo y el botón copiar |
| `PATCH /api/v1/accounts/:id` | Cambia `{ providerId?, email?, password?, note?, isActive? }`. Si viene `password`, se vuelve a cifrar |
| `POST /api/v1/accounts/:id/purchases` | Renovar: `{ price, purchasedOn, expiresOn }` → 201 con la cuenta |
| `PATCH /api/v1/purchases/:id` | Corrige `{ price?, purchasedOn?, expiresOn? }`; la fecha que no viene se compara con la guardada. Devuelve la cuenta |
| `DELETE /api/v1/purchases/:id` | Elimina una compra y devuelve la cuenta. La única de la cuenta → 400 |
| `DELETE /api/v1/accounts/:id` | Elimina la cuenta y sus perfiles |
| `POST /api/v1/accounts/:id/profiles` | Agrega un perfil («Perfil N+1») |
| `PATCH /api/v1/profiles/:id` | Cambia `{ name?, pin? }` |
| `DELETE /api/v1/profiles/:id` | Elimina un perfil. El último → 400 |

El precio referencial sale de `GET /api/v1/business-services`, que ya existe. Paginado y
búsqueda en el front mientras las listas sean chicas, como en el paso 2.

### Errores (todos en español)

| Caso | Status | Mensaje |
|---|---|---|
| Proveedor con nombre repetido | 409 | «Ya tienes un proveedor llamado «Juan».» |
| Eliminar proveedor con cuentas | 409 | «No puedes eliminar a «Juan»: tiene 3 cuentas. Cámbiales el proveedor o elimínalas primero.» |
| Proveedor inexistente o de otro negocio | 404 | «No encontramos ese proveedor.» |
| Número que no sirve para ese país | 400 | «Revisa el número: no es válido para ese país.» |
| Prefijo que no es de ningún país | 400 | «Elige el país del número.» |
| Número con letras o guiones | 400 | «El número solo lleva dígitos.» |
| Cuenta inexistente o de otro negocio | 404 | «No encontramos esa cuenta.» |
| Perfil inexistente o de otro negocio | 404 | «No encontramos ese perfil.» |
| Servicio no activo en el negocio | 400 | «Activa Netflix en Servicios para registrar cuentas.» |
| Cuenta repetida | 409 | «Ya tienes una cuenta de Netflix con ese correo.» |
| Vencimiento antes de la compra | 400 | «El vencimiento no puede ser antes de la fecha de compra.» |
| Fecha inválida | 400 | «Elige una fecha válida.» |
| Perfiles menor a 1 o con decimales | 400 | «La cuenta necesita al menos un perfil.» |
| Eliminar el último perfil | 400 | «La cuenta necesita al menos un perfil.» |
| PIN con letras o largo incorrecto | 400 | «El PIN son 4 números.» |
| Correo inválido | 400 | «Escribe un correo válido.» |
| Eliminar la única compra | 400 | «La cuenta necesita al menos una compra.» |
| Registrar la cuenta sin compra | 400 | «Completa la compra: precio, fecha de compra y vencimiento.» |
| Compra inexistente o de otro negocio | 404 | «No encontramos esa compra.» |
| Precio inválido | 400 | Los mismos del paso 2 |
| Falta `ACCOUNT_PASSWORD_KEY` o no descifra | 500 | «No pudimos leer la contraseña. Avísale a soporte.» (el detalle va al log, nunca la contraseña) |
| PATCH vacío | 400 | «No hay cambios para guardar.» |

## 8. Pantallas

Siguen [diseño](../diseno/): tabla en escritorio y card de listado en celular, sombras y
react-select.

### Navegación

- Rutas nuevas: `/cuentas` y `/proveedores`. El detalle de una cuenta es un **panel
  lateral** dentro de `/cuentas`, con la cuenta en la URL (`/cuentas?cuenta=<id>`): se
  puede recargar o compartir el link y vuelve abierto.
- **Barra inferior para todos:** Panel · Cuentas · Proveedores · Servicios. Hoy, sin
  Cuentas, Panel · Servicios · Proveedores.
- Negocios y Usuarios quedan **solo en el menú lateral** del superadmin. Con seis
  botones la barra inferior no entra en un celular, y esas dos pantallas no son del día a
  día (acordado 2026-10-13).

### `/proveedores`

- **Card:** nombre a la izquierda; `⋯` con «Editar» y «Eliminar» a la derecha; abajo el
  WhatsApp y la nota (y «3 cuentas», cuando existan).
- **El WhatsApp** se muestra con la bandera y el número sin prefijo. Al costado: copiar
  (copia el número completo con prefijo) y el ícono de WhatsApp, que es lo único que abre
  el chat (acordado 2026-10-13).
- **Tabla:** Proveedor · WhatsApp · Cuentas · acciones.
- **Modal crear / editar:** nombre, WhatsApp y nota.
- **Eliminar:** sin cuentas, `ConfirmModal`; con cuentas, una modal con el mensaje de RF-05
  y un solo botón «Entendido».
- Vacío: «Todavía no tienes proveedores» → «Agregar el primero».

### `/cuentas`

- **Card de celular** (acordada el 2026-10-13, rehecha el 2026-10-22; la cabecera y el
  cuerpo van en fondos distintos, como las cards de id-pos):
  - **Cabecera:** logo, **el servicio como título** y, debajo, solo el nombre del
    proveedor. **Tocarla abre el detalle** (no hay botón «Gestionar»). A la derecha, el
    switch, **enviar** (avión de papel en verde: copia el acceso completo de RF-18a, listo
    para WhatsApp) y `⋯`. Sin badge de «Activa».
  - **Cuerpo:** «Correo» y «Contraseña» (oculta, con su ojo al lado de la etiqueta), en dos
    columnas. **Sin botones de copiar: cada dato se copia manteniéndolo presionado.**
  - **Perfiles** (cuando vuelvan a mostrarse): **plegados por defecto**, con chevron: «Perfiles · 4 / 5 libres ⌄». Al
    abrir, un chip por perfil («P1»… «P5»).
  - **Vencimiento** (2026-10-22): **sin fecha ni fila «Vence»**. En la cabecera, debajo del
    proveedor, solo un aviso en color cuando hace falta, en 12 px como los badges: «● Venció
    el 06-set» (rojo; si es de otro año, «● Venció en oct-2025», para no cargar la card),
    «● Vence hoy» (naranja), «● Vence mañana» / «● Vence en 2 días» (amarillo). Al día no
    dice nada. Sin compras, «Sin compras» en gris. El `⋯` lleva «Renovar».
  - **Perfiles ocultos** hasta los alquileres (2026-10-22, `ARE_PROFILES_SHOWN`): hoy todos
    están libres y solo ocupan espacio.
- **Tabla:** Cuenta (logo y servicio) · **Credenciales** (correo arriba, contraseña oculta
  abajo con el ojo a su izquierda) · Proveedor · **Vence** (la fecha, pintada con los colores
  de RF-14) · Perfiles · Activa · acciones.
  Las acciones van **con borde**: enviar y `⋯` (con «Renovar», «Editar», «Eliminar»).
- Barra pegajosa con el buscador. **En escritorio**, al lado, los dos selects de filtros
  (servicio y proveedor); **en el celular**, el botón de filtros que abre su modal (acordado
  2026-10-22).
- Todo select de servicios lleva el logo de cada uno.
- Vacío: «Todavía no tienes cuentas» → «Registrar la primera».

### Modal registrar / editar cuenta

En este orden:

1. Servicio (react-select, solo los activos; no aparece al editar).
2. Proveedor (react-select, con la opción «Crear «…»» para agregarlo sin salir).
3. Correo.
4. Contraseña, con ojo.
5. Perfiles: el número, lleno con el del servicio. Solo al crear.
6. Nota.
7. **Solo al crear**, la primera compra: precio (lleno con el referencial, con la ayuda
   «Referencial de Netflix: S/ 20.00»), y fecha de compra y vencimiento lado a lado.
   Cambiar la fecha de compra corre el vencimiento a un mes después. Los tres campos son
   `PurchaseFields`, el mismo componente de la modal renovar.

### Modal renovar

Precio (lleno con el de la compra anterior, con la ayuda «La anterior costó S/ 20.00»),
fecha de compra (con el vencimiento anterior) y vencimiento (un mes después). Se abre desde
`⋯` en la card y la tabla, y desde el detalle. La misma modal corrige una compra
(«Corregir compra»).

### Detalle lateral de la cuenta

Estructura como el detalle de cliente de id-pos (acordado 2026-10-13): en celular ocupa la
pantalla, con «‹ Cuentas» para volver; en escritorio es un panel a la derecha sobre la
lista. Cada dato en una fila **ícono + etiqueta: valor**, agrupados en cards con título.

- **Encabezado:** imagen y nombre del servicio con su **badge de estado** al lado (Vencida ·
  Por vencer · Al día, acordado 2026-10-22; sin compras, ninguno), el correo debajo. A la derecha el switch y
  `⋯` con **«Copiar acceso»** (RF-18a), «Editar», «Renovar» y «Eliminar».
- **Cuenta** (lo que existe hoy, 2026-10-22):
  - ✉ Correo: `cuenta@gmail.com`
  - 🔒 Contraseña: `••••••••`, con su ojo
  - 🚚 Proveedor: DigitalStore
  - Los valores arrancan alineados aunque las etiquetas midan distinto. En escritorio el
    copiar (y el ojo) van a la izquierda del valor, dentro de su columna; en celular se
    copia manteniendo presionado el valor.
- **Compras (N)** (2026-10-22: una sola sección en vez de «Compra» y «Compras»), con
  «Renovar» en su encabezado:
  - 📅 Vence: 18 nov 2026 (con los colores de RF-14)
  - 💰 Pagado en total: S/ 60.00
  - Debajo, cada compra: «18 oct 2026 → 18 nov 2026», su precio y `⋯` («Corregir»,
    «Eliminar»; la única no lleva «Eliminar»).
  - Sin compras: «Todavía no tiene compras. Regístrala con «Renovar».»
- **Nota:** con su ícono; sin nota, «No hay nota» en gris (como «No hay comentarios» en
  id-pos).
- **Perfiles:** nombre y PIN editables ahí mismo, `⋯` con «Eliminar». Al final,
  «Agregar perfil». **Ocultos hasta los alquileres** (2026-10-22).

### Cambio en `/servicios`

El campo «Compra (cuenta)» pasa a decir **«Compra referencial»**. La ganancia de «Cuenta
llena» se calcula con ese precio.

## 9. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Aislamiento: ningún endpoint acepta `businessId`; un id de otro negocio da 404. Un `providerId` o `serviceId` del body se valida contra el negocio. |
| RNF-02 | La contraseña en claro solo existe en la respuesta de `/password` y en el formulario. Nunca en logs, en listados ni en mensajes de error. |
| RNF-03 | Cada listado se arma en una consulta (join + count), sin N+1. |
| RNF-04 | Mensajes en español y entendibles. |
| RNF-05 | Migración con `pnpm db:generate`. Secret solo con `wrangler secret put` o `.dev.vars`. |

## 10. Criterios de aceptación (tests)

En `apps/server/test/providers.spec.ts`, `accounts.spec.ts` y `profiles.spec.ts`:

**Proveedores**

- [ ] Crear, editar y listar con `accountCount`.
- [ ] Nombre repetido con otras mayúsculas → 409; el mismo nombre en otro negocio → 201.
- [ ] Eliminar sin cuentas → ok; con cuentas → 409 con la cantidad en el mensaje.
- [ ] El negocio B no ve ni toca los proveedores de A (404).

**Cuentas**

- [ ] Registrar con 5 perfiles crea la cuenta, su primera compra y 5 perfiles «Perfil 1…5».
- [ ] Renovar agrega una compra y el listado muestra el vencimiento nuevo.
- [ ] Eliminar la única compra → 400.
- [ ] Desactivar y activar la cuenta con el switch.
- [ ] Servicio inactivo en el negocio → 400.
- [ ] Proveedor de otro negocio → 404.
- [ ] Correo repetido para el mismo servicio → 409; el mismo correo en otro servicio → 201.
- [ ] Vencimiento antes de la compra → 400.
- [ ] En la base, `password_encrypted` no contiene la contraseña; `/password` la devuelve
      igual a la original.
- [ ] El listado y el detalle no traen la contraseña.
- [ ] Editar sin `password` no cambia la contraseña; con `password`, cambia.
- [ ] Mandar `serviceId` en el PATCH no cambia el servicio.
- [ ] Eliminar la cuenta elimina sus perfiles.
- [ ] El negocio B no ve la cuenta ni la contraseña de A (404).

**Perfiles**

- [ ] Agregar suma «Perfil 6».
- [ ] PIN «12a4», «123» o «12345» → 400; «1234» → ok.
- [ ] Eliminar el último perfil → 400.

**Otros**

- [ ] Cifrar y descifrar da lo mismo; dos cifrados de la misma contraseña son distintos.

## 11. Al terminar

- Pasar los acuerdos a [negocio/](../negocio/): un `inventario.md`, y actualizar
  [modelo](../negocio/modelo.md).
- Pasar a [convenciones](../tecnico/convenciones.md) el cifrado y las fechas en
  `America/Lima`; a [despliegue](../tecnico/despliegue.md), el secret
  `ACCOUNT_PASSWORD_KEY`.
- Pasar a [componentes](../diseno/componentes.md) el detalle lateral (filas ícono +
  etiqueta: valor), la contraseña con ojo y copiar, «Copiar acceso» y el select con
  «Crear».
- Comandos (los corre Thony): generar la llave, `wrangler secret put ACCOUNT_PASSWORD_KEY`
  y `.dev.vars`, `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm test`,
  `pnpm check-types`; en producción, `pnpm db:migrate:remote` y los deploys.

## 12. Respondido por el cliente (2026-10-13)

1. Las cuentas siempre han entrado con **correo**.
2. Los PIN son de **4 dígitos**.
3. La renovación va **aparte de la cuenta**, como una compra: la cuenta puede existir sin
   alquilarse, quedar en espera y volver a alquilarse por un mes, un año, etc.
