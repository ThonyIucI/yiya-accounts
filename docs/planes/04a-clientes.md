# ERS · Paso 4a: Clientes finales

| | |
|---|---|
| Estado | **Revisado con Thony** (2026-10-30). Las respuestas están en la sección 12 |
| Etapa | Paso 4a de la [hoja de ruta](../negocio/hoja-de-ruta.md) |
| Depende de | Nada nuevo: usa el campo de WhatsApp de proveedores (paso 3) |
| Lo usa después | Paso 4b (alquileres): cada alquiler es de un cliente |

## 1. Objetivo

Que cada negocio tenga la **agenda de sus clientes finales**: quién es, su WhatsApp (número
o nombre de usuario) y lo que quiera recordar de él. Sobre esa ficha se arman los alquileres del paso 4b, como en
id-pos una venta se arma sobre un cliente.


## 2. Alcance

**Entra:**

- **Clientes:** crear, editar, eliminar y buscar.
- **Detalle del cliente** en un panel lateral, como el de cuentas. En este paso muestra sus
  datos; en el 4b se le suman sus alquileres.
- **Crear un cliente sin salir** de otra pantalla, con la opción «Crear «…»» del select
  (la misma de proveedores). Se usa en el alquiler del 4b; acá queda lista.

**No entra (se ve después):**

| Qué | Cuándo |
|---|---|
| Lo que tiene alquilado, cuánto pagó, lo que le vence | Paso 4b, en el detalle del cliente |
| Mandarle por WhatsApp el aviso de vencimiento | Paso 5 (panel) y después, automático |
| Que el cliente entre a Yiya | Nunca: es un registro del negocio ([modelo](../negocio/modelo.md)) |
| Importar clientes | No hace falta: no hay Excel, todo se maneja desde WhatsApp (pregunta 4) |
| Elegir un contacto del celular para llenar nombre y número | Puede ser, más adelante (solo Chrome de Android) |
| Usuario de WhatsApp en proveedores | Solo si se pide (acordado 2026-10-30) |
| Correo, documento o dirección | No hacen falta: el negocio habla por WhatsApp |

## 3. Actores

| Actor | Hace |
|---|---|
| Dueño del negocio | Todo lo de este paso, solo en su negocio |
| Superadmin | Lo mismo, dentro del negocio elegido en su menú lateral |
| Ayudante | Nada todavía (sin pantallas) |

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-01 | Un cliente tiene **nombre** (obligatorio, 2 a 60 letras), **número de WhatsApp**, **usuario de WhatsApp** y **nota** (opcionales, nota hasta 200). El número es el mismo campo de proveedores: bandera y prefijo con buscador de países, y el número con el formato del país. Puede tener el número, el usuario o los dos. |
| RF-02 | **El nombre se puede repetir**: dos clientes pueden llamarse «Ana». Lo que no se repite es el **número** ni el **usuario**: «Ya tienes a «Ana» con ese número.» / «Ya tienes a «Ana» con ese usuario.» (acordado 2026-10-30). |
| RF-03 | El listado muestra nombre y WhatsApp, ordenado por nombre, con buscador (nombre, número, usuario o nota) y paginado. Desde el 4b suma servicios y alquileres. |
| RF-04 | El número se muestra como en proveedores (`PhoneValue`): bandera y número sin prefijo; se copia con prefijo manteniéndolo presionado en el celular o con el botón en escritorio. El usuario se muestra «@ana.pe» y se copia igual. |
| RF-04b | **Usuario de WhatsApp** (acordado 2026-10-30): se escribe con o sin «@» y se guarda sin ella. Va de 3 a 35 caracteres entre letras, números, punto y guion bajo (propuesta: WhatsApp no publica sus reglas exactas). «Ana.pe» y «ana.pe» cuentan como el mismo. |
| RF-04c | El botón de WhatsApp abre el chat: con número, `wa.me/<prefijo><número>`; sin número y con usuario, `wa.me/<usuario>`. Sin ninguno de los dos no se dibuja (nunca desactivado). |
| RF-05 | **Eliminar:** hoy se elimina con `ConfirmModal`. Desde el 4b, **solo si no tiene alquileres**, como el proveedor con cuentas: «No puedes eliminar a «Ana»: tiene 2 alquileres.». |
| RF-06 | Tocar la card o la fila abre el **detalle**, con el cliente en la URL (`/clientes?cliente=<id>`), como en cuentas. |
| RF-07 | Un select de clientes (react-select, con buscador por nombre o número y la opción «Crear «…»») queda en `modules/customers` para el alquiler del 4b. |

## 5. Reglas de negocio

1. **El cliente es del negocio.** Dos negocios pueden tener al mismo cliente con el mismo
   WhatsApp, y cada uno ve solo el suyo.
2. **El WhatsApp identifica al cliente**, no el nombre (acordado 2026-10-30): el nombre lo
   escribe el dueño como le sale («thony U.», «Thony Uriarte»); el número y el usuario son
   uno solo.
3. **Hay clientes sin número público:** WhatsApp deja usar un nombre de usuario en lugar
   del número, y su enlace `wa.me/<usuario>` abre el chat igual.
4. El nombre se guarda como lo escribió el dueño, sin espacios en los bordes ni dobles.

## 6. Modelo de datos

```
customers
─────────
id
business_id        → business (cascade)
name
country_prefix     texto, opcional («51», sin «+»)
phone              texto, opcional (solo dígitos)
whatsapp_username  texto, opcional (como lo escribió, sin «@»)
note               texto, opcional
created_at
updated_at
```

- **Tabla en plural** (acordado 2026-10-30, ver [convenciones](../tecnico/convenciones.md)).
  Se llama `customers`, no `clients`: en el código «client» ya se usa para el cliente de la
  API y el de la base.
- Mismo teléfono que `provider`: `country_prefix` + `phone`, y en la API
  `phone: { countryPrefix, number } | null`, validado con `packages/shared/src/phones.ts`.
- **Índice único (`business_id`, `country_prefix`, `phone`)** para RF-02. En SQLite un
  índice único deja varios `NULL`, así que los clientes sin número no chocan entre sí.
- **El usuario se guarda una sola vez, tal como lo escribieron**, sin una columna `_key`
  aparte: el índice único es sobre la expresión (`business_id`, `lower(whatsapp_username)`),
  así la base compara sin mayúsculas sin duplicar el dato. En la API va como
  `whatsappUsername: string | null`.
- Sin `name_key`: el nombre no es único (RF-02).
- Esquema en `packages/db/src/schema/customers.ts`; tipos y límites en
  `packages/shared/src/customers.ts`.

### Migraciones (qué crea cada una y para qué)

| Migración | Cambio | Para qué |
|---|---|---|
| Clientes | Tabla `customers` | La agenda de clientes finales de cada negocio |
| | `business_id` → `business` con `cascade` | Cada cliente es de un negocio; si se borra el negocio, se van |
| | `country_prefix` y `phone` | Su número de WhatsApp, igual que el del proveedor |
| | Índice único (`business_id`, `country_prefix`, `phone`) | Que no se registre dos veces el mismo número. Empieza por `business_id`, así también sirve para listar |
| | `whatsapp_username` | Para los clientes que usan usuario en vez de número |
| | Índice único (`business_id`, `lower(whatsapp_username)`) | Que no se registre dos veces el mismo usuario, sin importar mayúsculas |
| | `note` | Lo que el dueño quiera recordar («paga a fin de mes») |
| | Sin datos para lo que ya existe | Es una tabla nueva; no toca cuentas ni compras |

## 7. API

Todo con `requireAuth, requireBusiness` y filtrado por `c.var.business.id`. Un id de otro
negocio responde 404.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/v1/customers` | Clientes del negocio, ordenados por nombre |
| `GET /api/v1/customers/:id` | Un cliente (desde el 4b, con sus alquileres) |
| `POST /api/v1/customers` | Crea `{ name, phone?, whatsappUsername?, note? }` → 201 |
| `PATCH /api/v1/customers/:id` | Cambia `{ name?, phone?, whatsappUsername?, note? }` |
| `DELETE /api/v1/customers/:id` | Elimina. Desde el 4b, con alquileres → 409 |

Paginado y búsqueda en el front mientras la lista sea chica, como en proveedores. Si un
negocio pasa de unos cientos de clientes, se pasan al server (`{ data, meta }`).

### Errores (todos en español)

| Caso | Status | Mensaje |
|---|---|---|
| Número repetido | 409 | «Ya tienes a «Ana» con ese número.» |
| Usuario repetido | 409 | «Ya tienes a «Ana» con ese usuario.» |
| Usuario muy corto, largo o con otros caracteres | 400 | «El usuario va de 3 a 35 caracteres: letras, números, punto o guion bajo.» |
| Cliente inexistente o de otro negocio | 404 | «No encontramos ese cliente.» |
| Nombre muy corto o muy largo | 400 | «El nombre va de 2 a 60 letras.» |
| Nota muy larga | 400 | «La nota va hasta 200 letras.» |
| Número inválido, prefijo o letras | 400 | Los mismos de proveedores |
| PATCH vacío | 400 | «No hay cambios para guardar.» |
| Eliminar con alquileres (4b) | 409 | «No puedes eliminar a «Ana»: tiene 2 alquileres.» |

## 8. Pantallas

Siguen [diseño](../diseno/): tabla en escritorio y card de listado en celular, sombras y
react-select. Se arma **copiando el módulo de proveedores**, que tiene lo mismo (nombre,
WhatsApp, nota).

### Navegación

- Ruta nueva: `/clientes`.
- **Barra inferior** (acordado 2026-10-30): solo lo más usado, **Panel · Clientes · Cuentas
  · Alquileres**. En el 4a quedan Panel · Clientes · Cuentas, y Alquileres se suma en el 4b.
  Proveedores y Servicios salen de la barra y se abren desde el menú lateral (en el celular,
  con la pestaña del borde izquierdo).
- **El dueño recibe el menú lateral** (acordado 2026-10-31). Hoy solo lo tiene el superadmin
  ([componentes](../diseno/componentes.md)); si Proveedores y Servicios salen de la barra,
  el dueño no tendría otra forma de llegar a ellos. Para el dueño lleva Panel · Clientes ·
  Compras (Proveedores, Cuentas) · Servicios, sin Negocios ni Usuarios.

### `/clientes`

- **Card**, con el formato de la de proveedores (acordado 2026-10-30):
  - **Cabecera gris:** avatar de iniciales, el nombre y debajo un texto gris («Cliente
    desde oct 2026»; desde el 4b, «2 alquileres»). A la derecha, el botón de WhatsApp y `⋯`.
  - **Cuerpo en dos columnas:** «WhatsApp» (el número con `PhoneValue`, o «@usuario» si
    no tiene número) y, desde el 4b, «Servicios» (los logos de lo que alquila, con
    `ServiceAvatarStack`, como en proveedores).
  - **Sin nota en la card:** la nota se ve solo en el detalle.
  - Tocarla abre el detalle.
- **Avatar de color por cliente** (acordado 2026-10-30): a diferencia de proveedores (un
  solo color), cada cliente lleva un color que sale de su nombre, siempre el mismo, para
  distinguirlos de un vistazo. Es una prop de `InitialsAvatar`.
- **Tabla:** Cliente · WhatsApp · acciones (WhatsApp y `⋯`, los dos con borde). Desde el 4b
  suma Servicios y Alquileres. La nota tampoco va en la tabla.
- **`WhatsAppButton`** suma la prop del usuario para armar `wa.me/<usuario>` (RF-04c).
- Barra pegajosa con el buscador.
- **Modal crear / editar:** nombre, número de WhatsApp, usuario de WhatsApp y nota.
- Vacío: «Todavía no tienes clientes» → «Agregar el primero».

### Detalle lateral del cliente

Como el detalle de cuenta: en celular ocupa la pantalla con «‹ Clientes»; en escritorio, un
panel a la derecha. Filas **ícono + etiqueta: valor** agrupadas en cards.

- **Encabezado:** el nombre y, a la derecha, `⋯` con «Editar» y «Eliminar».
- **Datos:** número y usuario de WhatsApp (se copian y abren el chat) y desde cuándo es
  cliente («Desde 22 oct 2026»).
- **Nota:** sin nota, «No hay nota» en gris.
- **Alquileres** (llega en el 4b): lo que tiene alquilado, con su vencimiento, y el total
  pagado. Hoy no se muestra la sección vacía.

## 9. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Aislamiento: ningún endpoint acepta `businessId`; un id de otro negocio da 404. |
| RNF-02 | El listado se arma en una consulta. |
| RNF-03 | Mensajes en español y entendibles. |
| RNF-04 | Migración con `pnpm db:generate`. |

## 10. Criterios de aceptación (tests)

En `apps/server/test/customers.spec.ts`:

- [ ] Crear, editar y listar, ordenados por nombre.
- [ ] Dos clientes con el mismo nombre → los dos se crean.
- [ ] Dos clientes con el mismo número → el segundo, 409 con el nombre del primero.
- [ ] Dos clientes con el mismo usuario en otra mayúscula («Ana.pe» y «ana.pe») → 409.
- [ ] El usuario con «@» se guarda sin ella.
- [ ] Usuario de 2 caracteres o con espacios → 400.
- [ ] El mismo número o usuario en otro negocio → 201.
- [ ] Varios clientes sin número ni usuario → todos se crean.
- [ ] Editar el número o el usuario al de otro cliente → 409; dejarlo igual → ok.
- [ ] Número inválido para el país → 400.
- [ ] Nombre de 1 letra → 400.
- [ ] Eliminar → ok.
- [ ] El negocio B no ve ni toca los clientes de A (404).

## 10b. Porciones (acordado 2026-10-31)

Se construye por funcionalidad, back y front juntos; cada porción la prueba Thony antes de
seguir ([CLAUDE.md](../../CLAUDE.md)).

| # | Porción | Estado |
|---|---|---|
| 1 | **CRUD:** tabla `customers`, API, tests, `/clientes` con tabla, card, modal y eliminar. Clientes entra provisorio como quinto botón de la barra | Probada por Thony (2026-10-31) |
| 2 | **Detalle lateral** (RF-06, `/clientes?cliente=<id>`) con la nota. En la card lo abre la cabecera, como en cuentas: el cuerpo se mantiene presionado para copiar | En código (2026-10-31); falta probar |
| 3 | **Navegación:** menú lateral del dueño y barra Panel · Clientes · Cuentas | — |
| 4 | **Select de clientes** con «Crear «…»» (RF-07) | Puede esperar al 4b, que es quien lo usa |

## 11. Al terminar

- Pasar los acuerdos a [negocio/](../negocio/) en un `clientes.md` y actualizar
  [modelo](../negocio/modelo.md).
- Pasar a [componentes](../diseno/componentes.md) el campo de WhatsApp si se saca a
  `common/` para compartirlo entre proveedores y clientes, el usuario en `WhatsAppButton`
  y el menú lateral para el dueño, con la nueva barra inferior.
- Comandos (los corre Thony): `pnpm db:generate`, `pnpm db:migrate:local`,
  `pnpm --filter server test`, `pnpm check-types`; en producción,
  `pnpm db:migrate:remote` y los deploys.

## 12. Preguntas para Thony (respondidas 2026-10-30)

1. **¿El WhatsApp identifica al cliente?** Sí: el número no se repite y el nombre sí. Se
   suma el usuario de WhatsApp, que tampoco se repite.
2. **Barra inferior:** Panel · Clientes · Cuentas · Alquileres; el resto, en el menú lateral.
3. **¿Falta algún dato en la ficha?** Sin respuesta: queda nombre, número, usuario y nota.
4. **¿Dónde están hoy los clientes?** En WhatsApp, sin Excel: no hay carga masiva.
