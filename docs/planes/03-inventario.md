# ERS · Paso 3: Inventario (proveedores, cuentas y perfiles)

| | |
|---|---|
| Estado | Revisado con Thony (2026-10-13). **Proveedores hecho en código**; cuentas y perfiles, pendientes |
| Etapa | Paso 3 de la [hoja de ruta](../negocio/hoja-de-ruta.md) |
| Depende de | Paso 2, servicios y precios (hecho en código) |
| Lo usa después | Paso 4 (alquileres) y paso 5 (panel) |

## 1. Objetivo

Que cada negocio registre **qué cuentas tiene, a quién se las compró, cuánto le costaron,
cuándo vencen y qué perfiles tiene cada una**. Sobre esto se alquilan los perfiles en el
paso 4.

## 2. Alcance

**Entra:**

- **Proveedores:** la agenda del negocio, con crear, editar y eliminar.
- **Cuentas:** se registran con su servicio, su proveedor, sus credenciales, el precio que
  costaron y sus fechas.
- **Perfiles:** se crean solos al registrar la cuenta y se editan dentro de ella.
- Ver la contraseña de una cuenta con el ícono del ojo.

**No entra (se ve después):**

| Qué | Cuándo |
|---|---|
| Alquilar perfiles, y el estado libre / alquilado | Paso 4. Hasta entonces todos los perfiles están libres |
| Historial de renovaciones de una cuenta (cada renovación con su costo) | Paso 5, con el margen. Hoy se editan las fechas y el precio |
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
| RF-06 | Una cuenta tiene: **servicio**, **proveedor**, **correo o usuario**, **contraseña**, **precio de compra**, **fecha de compra**, **fecha de vencimiento** (con el proveedor) y **nota** (opcional). Todos obligatorios menos la nota. |
| RF-07 | Solo se registran cuentas de servicios **activos en el negocio**. Si no hay ninguno: «Activa un servicio en Servicios para registrar cuentas.» → «Ir a Servicios». |
| RF-08 | **El precio de compra es de cada cuenta**: lo que se pagó esa vez a ese proveedor. Al elegir el servicio, el campo se llena con el **precio referencial** del servicio en el negocio, y se puede cambiar (acordado 2026-10-12). |
| RF-09 | La fecha de compra viene con hoy y el vencimiento con un mes después. Ambas se pueden cambiar. El vencimiento no puede ser anterior a la compra. |
| RF-10 | No puede haber dos cuentas del mismo servicio con el mismo correo en un negocio («Ya tienes una cuenta de Netflix con ese correo.»). |
| RF-11 | Todo se edita después, **menos el servicio**: los perfiles dependen de él. Si se equivocó de servicio, elimina la cuenta y la registra de nuevo. |
| RF-12 | Eliminar una cuenta elimina sus perfiles, con confirmación. Desde el paso 4, no se podrá si tiene perfiles alquilados. |
| RF-13 | El listado muestra servicio (imagen y nombre), correo, proveedor, vencimiento y perfiles. Ordenado por vencimiento, la que vence antes primero. |
| RF-14 | El vencimiento dice «Vencida» (en rojo) si ya pasó y «Vence en N días» (en ámbar) si faltan 3 días o menos; si no, la fecha («12 nov»). |
| RF-15 | Buscador por correo y filtros por servicio y por proveedor (react-select). Paginado como en Servicios. |

### Contraseña

| ID | Requisito |
|---|---|
| RF-16 | En la base, la contraseña **se guarda cifrada**. En la pantalla, **se muestra** (acordado 2026-10-12). |
| RF-17 | Por defecto se ve oculta (`••••••••`). El ícono del ojo la muestra y vuelve a ocultarla. Va en la card, en la fila y en el detalle. |
| RF-18 | Al lado, un ícono para **copiarla** («Contraseña copiada»), y otro igual para el correo: es lo que el dueño le manda al cliente. |
| RF-19 | En el formulario de editar, la contraseña viene llena (oculta, con su ojo). Si no se toca, no cambia. |

### Perfiles

| ID | Requisito |
|---|---|
| RF-20 | Al registrar la cuenta se crean solos sus perfiles: tantos como **perfiles por cuenta** tenga el servicio. El número se puede cambiar en el formulario, solo al crear. |
| RF-21 | Se llaman «Perfil 1», «Perfil 2»… Cada uno tiene **nombre** y **PIN** (opcional, solo números, de 4 a 6). |
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
   | Cuenta | **El real**: lo que costó esa cuenta. De acá sale el margen (paso 5) |

   Cambiar el referencial no cambia las cuentas ya registradas.
3. Dinero en soles con dos decimales, igual que en el paso 2 (`parseSoles`).
4. Las fechas son días (sin hora), en hora de Perú. «Hoy» y «vencida» se calculan con
   `America/Lima`.
5. La contraseña **nunca** se guarda en texto plano, nunca va en logs y no viene en el
   listado: se pide aparte al tocar el ojo o copiar (sección 7).

## 6. Modelo de datos

```
provider                          account
────────                          ───────
id                                id
business_id  → business (cascade) business_id   → business (cascade)
name                              service_id    → service  (restrict)
name_key     único por negocio    provider_id   → provider (restrict)
country_prefix texto, opcional    login         correo o usuario
phone        texto, opcional      login_key     único (business_id, service_id, login_key)
note         texto, opcional
created_at                        password_encrypted   «v1:iv:cifrado» en base64
updated_at                        purchase_price real (soles)
                                  purchased_on  texto «2026-10-12»
profile                           expires_on    texto «2026-11-12», con índice
───────                           note          texto, opcional
id                                created_at
business_id  → business (cascade) updated_at
account_id   → account  (cascade)
name
pin          texto, opcional
position     entero (orden en la cuenta)
created_at
updated_at
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
- `login_key` = `login` sin mayúsculas ni espacios en los bordes.
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
| Cuentas y perfiles | Tablas `account` y `profile` | Se detallan cuando se programen |

## 7. API

Todo con `requireAuth, requireBusiness` y filtrado por `c.var.business.id`. Un id de otro
negocio responde 404, como si no existiera.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/v1/providers` | Proveedores del negocio, con `accountCount` |
| `POST /api/v1/providers` | Crea `{ name, phone?, note? }` → 201 |
| `PATCH /api/v1/providers/:id` | Cambia `{ name?, phone?, note? }` |
| `DELETE /api/v1/providers/:id` | Elimina. Con cuentas → 409 |
| `GET /api/v1/accounts` | Cuentas con servicio, proveedor y `profileCount`. **Sin contraseña** |
| `POST /api/v1/accounts` | Crea `{ serviceId, providerId, login, password, purchasePrice, purchasedOn, expiresOn, profileCount, note? }` y sus perfiles en un `db.batch` → 201 |
| `GET /api/v1/accounts/:id` | Una cuenta con sus perfiles. Sin contraseña |
| `GET /api/v1/accounts/:id/password` | `{ password }` descifrada. La piden el ojo y el botón copiar |
| `PATCH /api/v1/accounts/:id` | Cambia todo menos `serviceId`. Si viene `password`, se vuelve a cifrar |
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
| PIN con letras o largo incorrecto | 400 | «El PIN es de 4 a 6 números.» |
| Precio inválido | 400 | Los mismos del paso 2 |
| Falta `ACCOUNT_PASSWORD_KEY` o no descifra | 500 | «No pudimos leer la contraseña. Avísale a soporte.» (el detalle va al log, nunca la contraseña) |
| PATCH vacío | 400 | «No hay cambios para guardar.» |

## 8. Pantallas

Siguen [diseño](../diseno/): tabla en escritorio y card de listado en celular, sombras y
react-select.

### Navegación

- Rutas nuevas: `/cuentas`, `/cuentas/$accountId` y `/proveedores`.
- **Barra inferior para todos:** Panel · Cuentas · Proveedores · Servicios.
- Negocios y Usuarios quedan **solo en el menú lateral** del superadmin. Con seis
  botones la barra inferior no entra en un celular, y esas dos pantallas no son del día a
  día. **Por confirmar con Thony.**

### `/proveedores`

- **Card:** nombre y WhatsApp a la izquierda; `⋯` con «Editar» y «Eliminar» a la
  derecha; abajo «3 cuentas».
- **Tabla:** Proveedor · WhatsApp · Cuentas · acciones.
- **Modal crear / editar:** nombre, WhatsApp y nota.
- **Eliminar:** sin cuentas, `ConfirmModal`; con cuentas, una modal con el mensaje de RF-05
  y un solo botón «Entendido».
- Vacío: «Todavía no tienes proveedores» → «Agregar el primero».

### `/cuentas`

- **Card:** imagen del servicio, correo y proveedor a la izquierda; `⋯` con «Editar» y
  «Eliminar» a la derecha. Abajo: contraseña oculta con ojo y copiar, vencimiento (RF-14)
  y «5 perfiles». Tocar la card abre el detalle.
- **Tabla:** Servicio · Correo · Contraseña · Proveedor · Vence · Perfiles · acciones.
- Barra pegajosa con buscador y los filtros de servicio y proveedor.
- Vacío: «Todavía no tienes cuentas» → «Registrar la primera».

### Modal registrar / editar cuenta

En este orden:

1. Servicio (react-select, solo los activos; no aparece al editar).
2. Proveedor (react-select, con la opción «Crear «…»» para agregarlo sin salir).
3. Correo o usuario.
4. Contraseña, con ojo.
5. Precio de compra, lleno con el referencial y con la ayuda «Referencial de Netflix:
   S/ 20.00».
6. Fecha de compra y vencimiento, lado a lado.
7. Perfiles: el número, lleno con el del servicio. Solo al crear.
8. Nota.

### `/cuentas/$accountId`

- Arriba: servicio, correo y contraseña (con ojo y copiar), proveedor, precio, fechas y
  nota. «Editar» y «Eliminar» en `⋯`.
- Debajo, los **perfiles** en lista: nombre y PIN editables ahí mismo, `⋯` con «Eliminar».
  Al final, «Agregar perfil».

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

- [ ] Registrar con 5 perfiles crea la cuenta y 5 perfiles «Perfil 1…5».
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
- [ ] PIN «12a4» o «123» → 400; «1234» → ok.
- [ ] Eliminar el último perfil → 400.

**Otros**

- [ ] Cifrar y descifrar da lo mismo; dos cifrados de la misma contraseña son distintos.

## 11. Al terminar

- Pasar los acuerdos a [negocio/](../negocio/): un `inventario.md`, y actualizar
  [modelo](../negocio/modelo.md).
- Pasar a [convenciones](../tecnico/convenciones.md) el cifrado y las fechas en
  `America/Lima`; a [despliegue](../tecnico/despliegue.md), el secret
  `ACCOUNT_PASSWORD_KEY`.
- Pasar a [componentes](../diseno/componentes.md) el campo de contraseña con ojo y copiar,
  y el select con «Crear».
- Comandos (los corre Thony): generar la llave, `wrangler secret put ACCOUNT_PASSWORD_KEY`
  y `.dev.vars`, `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm test`,
  `pnpm check-types`; en producción, `pnpm db:migrate:remote` y los deploys.

## 12. Por confirmar con el cliente

1. ¿Las cuentas siempre entran con correo, o algunas con usuario o teléfono?
2. ¿Los perfiles tienen PIN siempre? ¿De cuántos números?
3. Al renovar una cuenta con el proveedor, ¿se paga de nuevo el mismo precio? Define cómo
   será el historial de renovaciones del paso 5.
