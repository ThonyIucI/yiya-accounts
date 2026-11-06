# ERS · Paso 4b: Alquileres

| | |
|---|---|
| Estado | **Revisado con Thony** (2026-11-04). Las respuestas están en la sección 12 |
| Etapa | Paso 4b de la [hoja de ruta](../negocio/hoja-de-ruta.md) |
| Depende de | Paso 3 (cuentas y perfiles) y paso 4a (clientes, y su select con «Crear «…»») |
| Lo usa después | Paso 5 (panel: qué vence pronto, perfiles libres, margen) |
| Acuerdos de base | [alquileres](../negocio/alquileres.md) |

## 1. Objetivo

Que el negocio registre **qué perfiles tiene cada cliente, por cuánto y hasta cuándo**, y
que cada día vea de un vistazo **a quién le vence algo** y le avise por WhatsApp con un
mensaje ya escrito, sin copiar datos a mano.

## 2. Alcance

**Entra:**

- **Alquilar un perfil** a un cliente, uno o varios a la vez, con su precio, su inicio y
  su vencimiento.
- **Listado con una fila por cliente**, como una orden: sus perfiles son los productos y se
  ven en el detalle (Thony, 2026-10-31).
- **Renovar** y **liberar** un perfil alquilado.
- **Avisar por WhatsApp:** se abre el chat con el texto ya escrito; el dueño toca enviar.
- En celular: **deslizar** la fila para avisar y **mantener presionado** para abrir las
  acciones en una hoja inferior, como la de Slack.
- Lo que falta del 4a: el **select de clientes** con «Crear «…»», lo alquilado en el detalle
  del cliente y el bloqueo al eliminar un cliente con alquileres.

**No entra (se ve después):**

| Qué | Cuándo |
|---|---|
| **Cambiar accesos** de una cuenta (correo, contraseña o los dos) con su historial, y avisar uno por uno a los que la tienen | Paso 4c, aparte (Thony, 2026-11-01). Ver sección 6, «Cambiar accesos» |
| **Finanzas:** caja, otros gastos, varios métodos de pago | Paso propio, cuando haga falta (sección 6, «Finanzas») |
| **Equipo** (ayudantes con su usuario) | Después. Cada alquiler ya guarda quién lo registró (RF-31) |
| **Clientes que son revendedores** (Thony, 2026-11-04): a veces alquilan perfiles y a veces **la cuenta completa**, sin asignar perfil. Hoy `rentals.profile_id` es obligatorio; para esto, el alquiler tendría que apuntar a la **cuenta** y el perfil quedar opcional (vacío = la cuenta entera). Choca con «solo se venden perfiles» del [modelo](../negocio/modelo.md) (2026-10-12), que habría que cambiar | Cuando haya un cliente así. Anotado, sin construir |
| Mandar varios avisos juntos («Seleccionar» en lote) | Después |
| Avisos automáticos de vencimiento | Después del paso 5 |
| Mensajes editados por cada negocio | Después: primero se usan fijos |
| Deslizar a la izquierda | Libre por ahora (Thony, 2026-10-31) |
| Combos y promociones | Por definir ([alquileres](../negocio/alquileres.md)) |

## 3. Actores

| Actor | Hace |
|---|---|
| Dueño del negocio | Todo lo de este paso, solo en su negocio |
| Superadmin | Lo mismo, dentro del negocio elegido en su menú lateral |

## 4. Requisitos funcionales

### Alquiler

| ID | Requisito |
|---|---|
| RF-01 | Un **alquiler** es **un perfil para un cliente**, con su **precio** (soles, 2 decimales), su **inicio** y su **vencimiento** (días sin hora, en hora de Perú, como las compras). Es el «producto» de la orden del cliente. |
| RF-02a | **Se cobra un solo total** (Thony, 2026-11-04): no se escribe un precio por perfil. El total se llena con el sugerido (precio de venta de cada servicio × sus meses) y se cambia a mano; combos y promociones llegarán después. Al guardar, el total se **reparte** entre los perfiles según lo que valdría cada uno, y cada alquiler guarda su parte: de ahí salen el margen por servicio y la renovación de cada perfil. Lo pagado se reparte igual. |
| RF-02 | (Antes del 2026-11-04, reemplazado por RF-02a para alquilar; sigue al editar un perfil.) El precio se llena con el de venta del servicio y se puede cambiar. El vencimiento se llena con inicio + 1 mes, con atajos de 1, 3, 6 y 12 meses, y se puede escribir cualquier fecha ([alquileres](../negocio/alquileres.md), punto 1). |
| RF-03 | **Cada alquiler vence por su lado** (Thony, 2026-10-31): un cliente puede tener Netflix desde el 3, Disney+ desde el 20 y dos perfiles de Max, y cada uno lleva su propio contador. |
| RF-04 | **Agregar un perfil a un cliente que ya tiene** es como agregar un producto a su orden: se hace desde su fila o su detalle, y queda junto a lo demás. No se crea otra fila. |
| RF-05 | **Un perfil puede estar alquilado a más de un cliente a la vez** (Thony, 2026-10-31): cuando hay mucha demanda, un perfil se presta por un tiempo a dos clientes, y una cuenta de 5 perfiles puede tener más de 5 clientes. **El sistema no lo impide**: lo avisa. |
| RF-06 | El **select de perfiles** muestra los del servicio elegido agrupados por cuenta, **los libres primero**. Los ocupados también se pueden elegir y dicen con quién están («P2 · con Ana»). Solo se ocultan los de cuentas desactivadas. Elegir uno ocupado avisa, sin bloquear: «Este perfil ya lo tiene Ana. Lo vas a compartir.». |
| RF-07 | El **cliente** se elige con el select de clientes del 4a (su RF-07), con buscador y «Crear «…»», como el cliente en el formulario de órdenes de id-pos: buscar o crear sin salir de Alquileres (Thony, 2026-11-01). |

### Pago y por cobrar (propuesta, 2026-11-01)

| ID | Requisito |
|---|---|
| RF-07b | Cada alquiler guarda **cuánto se pagó** (`paid_amount`) y **cuándo** (`paid_on`, el día del último pago). Al alquilar se llena con el precio y hoy: lo normal es que se pague al alquilar (Thony, 2026-10-31). Todo es por Yape: no se guarda el método. |
| RF-07c | **Por cobrar** cuando lo pagado es menor que el precio. Se puede poner la **fecha en que se comprometió a pagar** (`pay_by`), solo si la dio (Thony, 2026-10-31). |
| RF-07d | **Pago a medias:** se edita lo pagado del mismo alquiler (15 → 30), sin crear otro pago (Thony, 2026-11-01). Lo que se pierde: el ingreso cuenta en el día del **último** pago (sección 6, «Finanzas»). |

### Estado

| ID | Requisito |
|---|---|
| RF-08 | Cada alquiler está **al día**, **vence hoy**, **por vencer** (1 o 2 días) o **vencido**, con los colores y la regla de las cuentas (`getExpiry`, `ExpiryBadge`). No se guarda: sale de la fecha. |
| RF-09 | Un alquiler **vencido sigue ocupando el perfil** hasta que se renueva o se libera (Thony, 2026-10-31): el cliente suele pagar unos días tarde. |
| RF-10 | **Liberar** cierra el alquiler: el perfil deja de estar ocupado por ese cliente y el alquiler sale del listado. Se guarda el día en que se liberó. |
| RF-11 | **Renovar** crea un alquiler nuevo del mismo perfil y cliente, que empieza el día que vencía el anterior, con su precio. El anterior queda «renovado» y pasa al historial. Así **cada cobro queda registrado con su precio y su fecha**, que es lo que necesita el panel (sección 6, «Finanzas»). |

### Listado: una fila por cliente

| ID | Requisito |
|---|---|
| RF-12 | Una fila por **cliente con alquileres abiertos** (sin liberar ni renovar). Orden: el cliente con el vencimiento más cercano arriba. |
| RF-13 | La fila muestra solo lo necesario (Thony, 2026-10-31): avatar y **nombre del cliente**, debajo **los logos de sus servicios** (uno por perfil, con `ServiceAvatarStack`) y a la derecha **un badge de estado** y, solo cuando toca cobrar, **el monto** (RF-13b). Sin nombre de servicio, cuenta ni perfil: eso va en el detalle. |
| RF-13b | **Lo más minimalista posible** (Thony, 2026-11-04): **el badge es el monto** («S/ 30.00») con el color del estado; la frase («Por vencer en 2 días», «Debe desde el 3 nov») va en el tooltip. Si hay varios estados, gana el más urgente: **Vencido** (rojo) › **Debe** (rojo, por cobrar, RF-07c) › **Vence hoy** (naranja) › **Por vencer** (amarillo). El monto es lo de ese estado: el precio de lo vencido y lo que vence pronto, o lo que falta pagar. **Al día no lleva badge.** |
| RF-14 | **El estado va en el logo:** el logo de un perfil vencido, que vence hoy o por vencer lleva un punto de su color, como un badge de estado. Los que están al día no llevan nada. Así, con 4 servicios, se ve cuál es el que vence. |
| RF-15 | Buscador (cliente, correo de la cuenta) y filtros: estado (al día, por vencer, vencido) y servicio. |
| RF-16 | Tocar la fila abre el **detalle del cliente en Alquileres** (`/alquileres?cliente=<id>`). |

### Detalle: los perfiles como productos de la orden

| ID | Requisito |
|---|---|
| RF-17 | El detalle muestra al cliente (nombre, WhatsApp) y **una fila por perfil alquilado**, como los productos en el detalle de una orden: logo y servicio, cuenta (correo), perfil y PIN, precio, lo pagado o lo que debe, vencimiento con `ExpiryBadge`, y su `⋯` (Renovar, Registrar pago, Liberar, Editar, Enviar accesos). |
| RF-18 | Al pie, «Agregar perfil» (RF-04). Debajo, plegado, el **historial**: lo renovado y lo liberado. Sin «total al mes»: no se puede sumar un perfil de 1 mes con uno de 12 como si fueran mensuales. |
| RF-19 | **Clientes y Alquileres son cosas distintas** (Thony, 2026-11-01): Alquileres son los clientes **activos**; el que deja de alquilar sale de ahí y se ve solo en Clientes. Su detalle en `/clientes` muestra **qué servicios tiene alquilados hoy y cuáles alquiló alguna vez**, con fechas, para tener su historial. |

### Avisar por WhatsApp

| ID | Requisito |
|---|---|
| RF-20 | **Avisar** abre WhatsApp con el chat del cliente y el mensaje ya escrito (`wa.me/<número>?text=…`). **No lo envía:** el dueño toca enviar (Thony, 2026-10-31). |
| RF-21 | **Por vencer o vence hoy** (texto de Thony, **de usted**, 2026-10-31): «Hola Ana, su alquiler de Netflix vence en 3 días. ¿Me confirma si va a seguir renovando?». Con «vence hoy» y «vence mañana» según el día. |
| RF-22 | **Vencido** (texto de Thony, de usted): «Hola Ana, su alquiler de Netflix venció ayer. Si desea volver a renovar, con gusto le brindaremos atención.». |
| RF-23 | **Varios a la vez:** el aviso habla de los alquileres del cliente que están por vencer o vencidos. Si vencen el mismo día, van juntos («su alquiler de Netflix y Disney+ vence en 3 días»); si no, una frase por cada uno. Si no tiene nada por vencer, «Avisar» abre la lista para elegir el mensaje. |
| RF-24 | **Accesos**, que se ofrece al alquilar y está en el `⋯` de cada perfil. Un bloque por perfil si se alquilaron varios: «Hola Ana, estos son los accesos de su alquiler: / *Netflix* / Correo: x@gmail.com / Contraseña: … / Perfil: P2 · PIN 1234 / Vence: 30 nov 2026 / Por favor, use solo su perfil y no cambie la contraseña. Cualquier consulta, aquí estamos.» El **cambio de contraseña** va con «Cambiar accesos» (4c). |
| RF-25 | Sin número ni usuario: «Ana no tiene WhatsApp. Agrégalo en su ficha.» (nunca un botón desactivado). Con solo usuario, ver RNF-05. |

### Gestos en celular

| ID | Requisito |
|---|---|
| RF-26 | **Deslizar la fila a la derecha → Avisar** (RF-23), como «Archivar» en Telegram. |
| RF-27 | **Mantener presionada la fila → hoja inferior de acciones**, como la de Slack: arriba botones grandes de acceso rápido (Avisar, Agregar perfil, Renovar todo lo vencido) y debajo la lista (Enviar accesos, Cambio de contraseña, Ver detalle, Abrir WhatsApp). |
| RF-28 | **Ningún gesto es el único camino:** lo que se hace deslizando o manteniendo presionado también está en el detalle y en el `⋯` de escritorio. |

### Bloqueos al eliminar

| ID | Requisito |
|---|---|
| RF-29 | No se elimina un cliente con alquileres: «No puedes eliminar a «Ana»: tiene 2 alquileres.». |
| RF-30 | No se elimina una cuenta ni un perfil con alquileres abiertos: «No puedes eliminar esta cuenta: tiene 3 perfiles alquilados.». |

### Quién lo registró

| ID | Requisito |
|---|---|
| RF-31 | Cada alquiler guarda **qué usuario de Yiya lo registró** (`created_by_id`), sacado de la sesión. No necesita el equipo: hoy distingue al dueño del superadmin, y cuando haya ayudantes ya tendrá historia. Agregarlo después dejaría vacíos los alquileres anteriores (Thony, 2026-11-01). Por ahora no se muestra en pantalla. |

## 5. Reglas de negocio

1. **Se vende el perfil, no la cuenta**, y cada alquiler tiene su propio precio y su tiempo
   ([alquileres](../negocio/alquileres.md)).
2. **El cliente es la orden y cada perfil es un producto** (Thony, 2026-10-31).
3. **Compartir un perfil se permite** (Thony, 2026-10-31).
4. Un perfil está **ocupado** mientras tenga al menos un alquiler sin liberar ni renovar,
   aunque esté vencido.
5. El precio del servicio es **referencial**: solo llena el campo.
6. Lo renovado y lo liberado es historial: no se edita.

## 6. Modelo de datos

```
rentals
───────
id
business_id      → business (cascade)
customer_id      → customers (restrict)
profile_id       → profile (restrict)
price            real, 2 decimales: lo acordado, con el descuento
paid_amount      real, 2 decimales: lo pagado hasta hoy
paid_on          opcional: el día del último pago
pay_by           opcional: el día en que se comprometió a pagar
starts_on        «2026-10-31»
expires_on       «2026-11-30»
released_on      opcional: se liberó ese día
renewed_by_id    opcional → rentals: el alquiler que lo renovó
created_by_id    → user (set null): quién lo registró
created_at / updated_at
```

- **Sin cabecera de orden.** Como la orden es el cliente (regla 2), no hace falta una tabla
  aparte que agrupe: cada fila de `rentals` es un perfil alquilado y el listado las agrupa
  por `customer_id`. Esto reemplaza la propuesta del 2026-10-22 (alquiler con código
  `AL-000012` y líneas).
- `customer_id` y `profile_id` con `restrict`: no se borra un cliente ni un perfil con
  historial (RF-29, RF-30).
- Esquema en `packages/db/src/schema/rentals.ts`; tipos y límites en
  `packages/shared/src/rentals.ts`.

### Finanzas (acordado 2026-11-01: sin tabla de pagos por ahora)

Hoy **ya se guardan los dos lados del dinero**, sin tabla de movimientos:

| Lado | Dónde | Fecha |
|---|---|---|
| **Egreso:** lo que se le paga al proveedor | `account_purchase.price` (paso 3), cada compra y renovación de cuenta | `purchased_on` |
| **Ingreso:** lo que se le cobra al cliente | `rentals.paid_amount`, cada alquiler y renovación (RF-11) | `paid_on` |

**Lo que se acepta al no tener tabla de pagos:** un pago a medias se edita (RF-07d), así que
si pagó 15 el 28 de octubre y 15 el 2 de noviembre, los 30 cuentan en noviembre. Si eso
llega a molestar en el panel, o aparece un segundo método de pago, se crea la tabla de pagos
y se pasa lo que hay conservando los datos.

Con eso el panel (paso 5) ya puede sacar ingresos y egresos del mes, la ganancia, los
servicios más vendidos (alquileres por servicio) y los más rentables (ingresos menos compras
por servicio), sin guardar nada más.

**Por qué no una tabla `movements` ahora:** repetiría los precios que ya están en las compras
y los alquileres, y dos lugares con el mismo dato terminan sin coincidir (es la misma razón
por la que el vencimiento de la cuenta no se copia a la cuenta). Se suma cuando haga falta
algo que **no sale** de compras ni alquileres: una **caja** (efectivo, Yape, banco), **otros
gastos** (publicidad, la luz) o **cobros a medias**. Entonces se diseña como paso propio:
`movements` con `type` (`income` / `expense`), monto, fecha, caja y, opcional, el alquiler o
la compra que lo originó.

### Cambiar accesos (paso 4c, propuesta 2026-11-01)

Cuando el proveedor cambia la cuenta o la contraseña, **se cambian los accesos de la misma
cuenta**, no se crea otra: los alquileres apuntan a sus perfiles, y mover cada cliente de la
cuenta vieja a la nueva es lo más delicado. Lo que importa es cumplirle al cliente el
período que pagó, no el vencimiento ante el proveedor (Thony, 2026-11-01).

- **Historial en una tabla** (`account_access_changes`: cuenta, correo anterior, qué cambió,
  día), no en la nota: así después se puede ver **cada cuánto un proveedor cambia cuentas o
  contraseñas** y usarlo para decidir si seguir con él (Thony, 2026-11-01).
- Al guardar, la lista de los clientes que tienen la cuenta, con un botón de WhatsApp por
  cada uno. Los ya avisados se guardan en `localStorage` hasta avisar al último (Thony: el
  dueño usa un solo dispositivo).

**Riesgos a resolver en su ERS:**

1. **La cuenta de reemplazo viene de otro proveedor o es otra compra.** Ahí sí es otra
   cuenta, y hace falta «Mover a otra cuenta»: pasar los alquileres a perfiles de la nueva.
2. **Perfiles comprados sueltos** (Thony, 2026-11-01): entran como una cuenta de 1 perfil.
   Si se compra otro perfil del mismo correo, se **agrega un perfil a esa cuenta** con su
   compra (Thony, 2026-11-04). Límite aceptado: el vencimiento de la cuenta es el de su
   compra más lejana, así que si el primer perfil vence antes con el proveedor, la cuenta no
   lo muestra.
3. **El proveedor vence antes que el cliente.** Si la cuenta vence el 5 con el proveedor y
   Ana la tiene hasta el 20, hay que renovarla o pasar a Ana a otra cuenta. Es un aviso
   para el panel (paso 5).

### Migraciones (qué crea cada una y para qué)

| Migración | Cambio | Para qué |
|---|---|---|
| Alquileres | Tabla `rentals` | Cada perfil alquilado a un cliente, con su precio y sus fechas |
| | `customer_id` → `customers` con `restrict` | No se pierde el historial al eliminar un cliente |
| | `profile_id` → `profile` con `restrict` | No se elimina un perfil que tiene alquileres |
| | `paid_amount`, `paid_on`, `pay_by` | Lo pagado, cuándo, y la fecha prometida si queda por cobrar |
| | `created_by_id` → `user` con `set null` | Quién lo registró; si se borra el usuario, el alquiler queda |
| | Índice (`business_id`, `expires_on`) | El listado ordenado por lo que vence |
| | Índice (`customer_id`) | El detalle de un cliente |
| | Índice (`profile_id`) | Saber rápido si un perfil está ocupado y con quién |
| | Sin datos para lo que ya existe | Es una tabla nueva; no toca cuentas ni clientes |

## 7. API

Todo con `requireAuth, requireBusiness` y filtrado por `c.var.business.id`. Un id de otro
negocio responde 404.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/v1/rentals` | Clientes con alquileres abiertos, cada uno con los suyos (servicio, cuenta, perfil), ordenados por el vencimiento más cercano |
| `GET /api/v1/customers/:id/rentals` | Los alquileres de un cliente: abiertos e historial (con `releasedOn` y `renewedById`), lo más nuevo arriba. Se pide al abrir el historial |
| `POST /api/v1/rentals` | `{ customerId, items: [{ profileId, price, startsOn, expiresOn }] }`: alquila uno o varios perfiles juntos → 201 |
| `PATCH /api/v1/rentals/:id` | Cambia `{ profileId?, price?, startsOn?, expiresOn? }` de uno abierto |
| `POST /api/v1/rentals/:id/renew` | `{ price, paidAmount?, payBy?, startsOn?, expiresOn }` → crea el nuevo y marca el anterior. Sin `paidAmount`, pagado completo |
| `POST /api/v1/rentals/:id/release` | Libera hoy → `{ id }`. Ya liberado o renovado: 409 |
| `DELETE /api/v1/rentals/:id` | Elimina uno mal cargado |
| `GET /api/v1/profiles/availability?serviceId=` | Perfiles del servicio por cuenta, con quién los tiene (para el select) |

Los mensajes se arman en el front con los datos del alquiler; la contraseña sale de
`GET /api/v1/accounts/:id/password`, la que ya usa el ojo de la cuenta.

### Errores (todos en español)

| Caso | Status | Mensaje |
|---|---|---|
| Sin perfiles | 400 | «Agrega al menos un perfil.» |
| Vence antes de empezar | 400 | «El vencimiento tiene que ser después del inicio.» |
| Precio negativo o con más de 2 decimales | 400 | «El precio va en soles, por ejemplo 7.50.» |
| Perfil de una cuenta desactivada | 400 | «Esa cuenta está desactivada: actívala o elige otro perfil.» |
| Cliente, alquiler o perfil de otro negocio | 404 | «No encontramos ese alquiler.» (y los equivalentes) |
| Renovar, editar o liberar uno ya renovado o liberado | 409 | «Este alquiler ya se renovó.» / «Este alquiler ya se liberó.» |
| Eliminar cliente, cuenta o perfil con alquileres | 409 | Los de RF-29 y RF-30 |

## 8. Pantallas

### Navegación

- Ruta nueva `/alquileres`. **Barra inferior: Panel · Alquileres · Cuentas** (Thony,
  2026-11-01): Clientes sale de la barra y queda en el menú lateral. Reemplaza lo acordado
  en el 4a.
- En el menú lateral, un grupo **Ventas** con Alquileres y Clientes, como Compras agrupa
  Proveedores y Cuentas (propuesta).
- **Íconos de `lucide-react`**, como en el resto de la app. Alquileres con `CalendarClock`
  (propuesta: lo que se mira es el vencimiento).
- En la cabecera de `/alquileres`, el botón **«Alquilar»**: abre la modal con el select de
  clientes para buscar o crear (RF-07).

### `/alquileres` en celular: lista seguida, como Gmail (Thony, 2026-10-31)

Es **un patrón nuevo**, distinto de la card de listado de las otras vistas. Si se aprueba,
se documenta en [componentes](../diseno/componentes.md) como `SwipeRow`.

```
┌──────────────────────────────────────────┐
│ (A)  Ana Torres                   en 3 d │  ← color del más cercano
│      [N]•[D][M]                          │  ← logos; el punto marca el que vence
├──────────────────────────────────────────┤  ← solo una línea fina
│ (L)  Luis                       hace 2 d │
│      [D]•                                │
├──────────────────────────────────────────┤
│ (S)  Sam                         en 12 d │
│      [N][N]                              │
└──────────────────────────────────────────┘
```

- Filas seguidas sobre el fondo, sin sombra por fila, separadas por una línea fina que
  empieza después del avatar (como Gmail y Telegram). Sin badges de texto: el color va en el
  vencimiento y en el punto del logo.
- **Deslizar a la derecha** (RF-26): debajo aparece el fondo verde de WhatsApp con su ícono
  y «Avisar». Pasado el umbral, el ícono da un pequeño salto; al soltar, se abre WhatsApp y
  la fila vuelve a su lugar. Antes del umbral, vuelve sin hacer nada.
- **Mantener presionado** (RF-27): la fila se hunde un poco (`scale(0.98)`) y se abre la
  hoja inferior (la `Modal`, que en celular ya es hoja inferior).
- Las filas no dejan seleccionar texto (`select-none`, sin el menú del navegador al
  mantener presionado).

### `/alquileres` en escritorio

- **Tabla:** Cliente · Servicios (logos con su punto) · Vence · Debe / por renovar · acciones
  (botón de WhatsApp para avisar y `⋯` con lo mismo de la hoja inferior).
- Tocar la fila abre el detalle.

### Alquilar: página `/alquileres/nuevo`, como el carrito de id-pos (2026-11-04)

Página propia y no modal: en escritorio necesita dos columnas. Editar un perfil sigue en una
modal chica. **Sin encabezado, sin título y sin «‹ Alquileres»** (Thony, 2026-11-04): le
quitaban alto al carrito; se sale con el ✕ de arriba a la izquierda, como en id-pos. El
catálogo va sobre fondo gris y el carrito a todo el alto, con el cobro fijo abajo.

- **Izquierda:** el **servicio** como una fila de logos con scroll horizontal al lado de su
  label (`ServicePicker`), y sus **cuentas como cards de producto**: logo, correo, precio
  por perfil y, en chico, «3 libres» (para saber cuál tiene espacio). Tocar una card agrega
  al carrito su siguiente perfil libre; si no quedan libres, uno compartido, con aviso.
- **Derecha:** el **cliente** con un buscador como `SearchClientMulti` de id-pos: «Crear
  «…»» abre la modal de cliente con lo escrito. Debajo, el **carrito**: cada perfil con su
  correo, el perfil (se cambia ahí mismo) y la duración (1 mes · 3 · 6 · 1 año, u otras
  fechas); abajo **un solo total**, «Pagó completo» y «Alquilar».
- **Celular:** una columna; el carrito se abre desde una barra fija abajo («2 perfiles ·
  S/ 30.00»), en una hoja inferior.
- Desde «Agregar perfil» de un cliente, llega con `?cliente=<id>` y el cliente ya elegido.
- **Ajustes (Thony, 2026-11-04):**
  - Arriba, sobre blanco: el cliente (en celular) y debajo el servicio (label arriba,
    logos con scroll abajo). El cliente elegido va en tono de marca, distinto a las cards
    de producto. Solo el catálogo va sobre gris.
  - **Detalle de la cuenta, como la modal de producto de id-pos** (`RentalItemModal`): se
    abre al tocar la card del catálogo o una línea del carrito. La imagen del servicio, al
    lado los 4 tiempos como badges y abajo sus perfiles como cards: el libre con círculo
    punteado, el ocupado con las iniciales de quien lo tiene y su nombre debajo. El «+» de
    la card agrega directo, sin abrir el detalle.
  - **Línea del carrito:** logo, el perfil asignado con el **badge** de su tiempo al lado,
    el correo en chico, su parte del total y un tacho para quitarla.
- **Segunda ronda (Thony, 2026-11-04):**
  - Sin ✕ de salir: quitaba espacio y ya se sale con la navegación.
  - El catálogo gris lleva sombra arriba y llega hasta el fondo en celular.
  - Modal: el correo como subtítulo del encabezado; el precio grande debajo del logo.
  - Tiempos: el elegido lleno con check, el resto en **outline** de marca (en gris
    parecerían apagados). «Más…» con ícono de calendario es un badge más: abre las fechas
    en un bloque de otro fondo. Debajo, «Del … al …» en color de marca.
  - Perfil libre sin la palabra «Libre»: el círculo punteado y sin nombre ya lo dicen.
- **Tercera ronda (Thony, 2026-11-04):**
  - El rango dice «Del 04 nov → 04 dic» sobre `bg-muted`. Con «Más…», los inputs (delgados)
    van **en su lugar**, en línea: «Del [ ] Al [ ]».
  - Tiempos no elegidos en outline neutro (ajuste de Thony).
  - El servicio del catálogo pasa a **chips con el nombre** y flechas en escritorio, como
    las categorías de id-pos: con logos se confundían.
- **Listado de Alquileres simplificado (Thony, 2026-11-04):** sin el título ni «3 clientes
  activos» en celular: solo el buscador, y crear es un **«+» flotante** como en id-pos
  (`FloatingActionButton`, baja con la barra de navegación cuando se esconde). Escritorio,
  como el reporte de ventas de id-pos: título y recargar a la izquierda; buscador y
  «Alquilar» a la derecha.
- **Flujo en celular, como id-pos (Thony, 2026-11-04):** dos vistas.
  1. El formulario: «Cliente» (con label), los perfiles ya agregados (vacío: «Elegir
     perfiles»; con algo: «Agregar más perfiles») y el cobro en el cuerpo. Pie: **solo**
     Cancelar y Alquilar.
  2. El catálogo: flecha para volver, los servicios en chips y sus cuentas. Pie: «Agregar»,
     que vuelve al formulario (sin perfiles nuevos, avisa en vez de volver).
  - Escritorio no cambia de vistas: solo el pie pasa a Cancelar y Alquilar, y el cobro
    sube al cuerpo del carrito.
- **Fila del listado en celular (Thony, 2026-11-06):** reemplaza RF-13, RF-13b y RF-14 en
  celular. Los servicios **como texto**, separados por coma y sin repetirse; si no entran, un
  badge neutro «+N» con los servicios que faltan. A la derecha, **siempre** lo próximo a
  cobrar y su fecha, con el color del estado (rojo vencido o debe, naranja hoy, amarillo
  pronto): la fecha en texto de color y el monto como badge de color. Al día, los dos
  neutros y el monto sin fondo. Todo a 12 px. El estado de cada perfil se ve en el detalle. Sin
  «Mostrando» ni paginado: se muestran todos.
- Después: **«Enviar accesos»** al terminar (RF-24, porción 3).

### Detalle del cliente en Alquileres

Panel lateral como el de clientes: encabezado con el nombre y el botón de WhatsApp; sección
**Perfiles** con sus alquileres abiertos como productos de una orden (RF-17), el total y
«Agregar perfil»; sección **Historial** plegada (RF-18).

## 9. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Aislamiento: ningún endpoint acepta `businessId`; un id de otro negocio da 404. |
| RNF-02 | El listado se arma en una consulta. |
| RNF-03 | Mensajes en español y entendibles. |
| RNF-04 | Migración con `pnpm db:generate`. |
| RNF-05 | Sin verificar: `wa.me/<usuario>?text=` quizás no llena el mensaje cuando hay usuario en vez de número. Se prueba en la porción de avisos; si no funciona, se copia el mensaje y se abre el chat. |
| RNF-06 | Los gestos respetan `prefers-reduced-motion` y no chocan con el scroll: el deslizamiento empieza solo si el dedo se mueve más en horizontal que en vertical. |
| RNF-07 | Deslizar a la derecha no debe disparar el «atrás» del navegador ni la pestaña del menú lateral, que están en el borde izquierdo. |
| RNF-08 | **Pocas lecturas** (D1 cobra por filas leídas; Thony, 2026-11-01): cada filtro frecuente con su índice, el listado en una consulta, y después de crear, renovar, pagar o liberar se actualiza la fila en el front con lo que devuelve la API (`onUpsert`), sin volver a pedir la lista. No se cachea en el server: con estos volúmenes no hace falta, y una caché vieja mostraría un vencimiento que ya se renovó. |

## 10. Criterios de aceptación (tests)

En `apps/server/test/rentals.spec.ts`:

- [ ] Alquilar 3 perfiles de servicios distintos a un cliente → 201; el listado lo muestra en una fila con los 3.
- [ ] Agregar un perfil a un cliente que ya tiene → sigue en una sola fila.
- [ ] Dos clientes con el mismo perfil abierto → los dos se crean (RF-05).
- [ ] Una cuenta de 5 perfiles con 6 alquileres abiertos → se crean.
- [ ] Sin perfiles → 400. Vence antes de empezar → 400. Cuenta desactivada → 400.
- [ ] Renovar → uno nuevo desde el vencimiento anterior; el anterior pasa al historial.
- [ ] Renovar con una parte pagada → guarda lo pagado y la fecha prometida; pagar más que el precio → 400.
- [ ] Renovar dos veces el mismo → 409.
- [ ] Liberar → sale del listado y queda en el historial; liberarlo otra vez o renovarlo → 409.
- [ ] Historial del cliente → lo abierto y lo renovado, lo más nuevo arriba.
- [ ] Vencido sin liberar → el perfil sigue ocupado.
- [ ] Listado ordenado por el vencimiento más cercano de cada cliente.
- [ ] Eliminar cliente, cuenta o perfil con alquileres → 409.
- [ ] El negocio B no ve ni toca los alquileres de A (404).

## 10b. Porciones (propuesta)

Por funcionalidad, back y front juntos; Thony prueba cada una antes de seguir.

| # | Porción | Qué se puede probar |
|---|---|---|
| 1 | **CRUD de alquileres** (Thony, 2026-11-04: «CRUD completo»): tabla, API (listar, alquilar, editar, eliminar), select de clientes con «Crear «…»» (RF-07 del 4a), modal de alquilar con el select de perfiles, listado por cliente (tabla y lista seguida, sin gestos todavía), un detalle simple con sus perfiles (Editar, Eliminar, Agregar perfil), los bloqueos al eliminar y Alquileres en la barra. **En código (2026-11-04); falta probar** | Cargar alquileres reales y ver quién vence primero |
| 2 | **Renovar y liberar**, el historial en el detalle, y lo alquilado en el detalle del cliente de `/clientes` | El ciclo completo de un perfil alquilado |
| | *Acuerdos de la porción 2 (Thony, 2026-11-06):* la renovación empieza cuando vencía la anterior y dura lo mismo, con el precio anterior como sugerido; se **eligen los perfiles** a renovar (a veces renueva uno y suelta otro); antes de guardar, una **modal de confirmación** con servicio, correo, tiempo y precio de cada uno. Las fechas con `RentalPeriodPicker`. «Renovar todo lo vencido» va en la porción 4. **Ajuste (2026-11-06):** un botón «Renovar» por cada perfil del detalle, aunque no esté vencido; abre una modal que es la confirmación: logo, correo, «Del … al …» (no se edita: para otras fechas se edita el alquiler) y el monto en un input. Se da por pagado completo. API: `POST /rentals/:id/renew { price, startsOn?, expiresOn }` | |
| | *Ajuste (2026-11-06, segunda vuelta):* «Renovar» es un ícono junto al `⋯` de cada perfil. La modal usa `RentalPeriodPicker`: se puede renovar por otro tiempo (3 meses) y empezar después del vencimiento, nunca antes (eso es editar). El monto sugerido es el precio mensual anterior × los meses nuevos, hasta que se escribe a mano. La card del perfil en el detalle: logo, servicio, estado y correo; debajo tres columnas **Perfil · Monto · Fechas** con el nombre arriba y el valor abajo. Monto: lo pagado en verde y lo que falta en amarillo (sin la palabra «pagado»). Fechas: el inicio con una flecha hacia abajo y el vencimiento en su color | |
| | *Ajuste (2026-11-06, tercera vuelta):* la modal de renovar lleva el switch **«Pagó todo»** como el carrito, prendido por defecto (por si acaso); apagado, pide «Pagó» y «Paga el (opcional)». **Liberar** va en el `⋯` de cada perfil, con confirmación: guarda el día y el alquiler pasa al historial. **Historial por perfil:** debajo de cada perfil, «Historial» plegado; al abrirlo se pide `GET /customers/:id/rentals` una vez por cliente y se muestran los alquileres anteriores de ese perfil (renovados o liberados), lo más nuevo arriba, en las mismas tres columnas: cuándo pagó (y si se renovó o liberó), el monto y de cuándo a cuándo. Lo liberado de un perfil que ya no tiene abierto se verá en el detalle de `/clientes` (RF-19). **Cada perfil es una card propia** con cabecera gris como la card de cuenta (logo, servicio, estado, correo, Renovar y `⋯`) y el cuerpo con las tres columnas y el historial; **«Agregar perfil»** pasa al encabezado del panel | |
| 2b | **Menos llamados al abrir «Alquilar»** (Thony, 2026-11-06: después de Liberar). Hoy `/alquileres/nuevo` pide 5 cosas: `get-session` (en **cada** cambio de pantalla, desde el `beforeLoad` de `_app`), `customers` (**todos**, para el buscador), `business-services`, `accounts` y `rentals` (para el catálogo). Propuesta: recordar la sesión en vez de pedirla en cada pantalla; el buscador de clientes busca en el servidor; y un solo `GET /rentals/catalog` con servicios, cuentas, perfiles y quién los ocupa | Abrir «Alquilar» con 1 o 2 llamados |
| 3 | **Avisar por WhatsApp:** los mensajes, desde el detalle y el botón de la tabla. **Y al confirmar un alquiler o una renovación, «Enviar al cliente»** (Thony, 2026-11-06): ver «Enviar por WhatsApp» abajo | Que el texto llegue bien armado al chat |
| 4 | **Gestos en celular:** deslizar para avisar y mantener presionado para la hoja | Sentir el gesto en el celular |
| 5 | Filtros y buscador | — |

### Enviar por WhatsApp (acordado 2026-11-06)

**«Enviar por WhatsApp» siempre es la app de WhatsApp, gratis:** un acceso directo o el menú
de compartir del teléfono, como cuando se comparte la captura de un Yape. Yiya deja todo
listo y abre WhatsApp; **el dueño elige el chat y toca enviar**. La API de WhatsApp Business
(de pago) **no está en planes**: no tiene sentido habiendo una forma gratuita y fácil
(Thony, 2026-11-06).

Al confirmar un alquiler (o una renovación) se ofrece «Enviar al cliente», con dos partes:

| Parte | Qué lleva | Por qué |
|---|---|---|
| **Imagen: el comprobante** | Logo del negocio, cliente, y por cada perfil: servicio, correo de la cuenta, perfil, precio y «Del … al …»; el total y lo que debe, si debe | Para el cliente es la constancia, y sirve de referencia visual en el chat |
| **Mensaje de texto: los accesos** | De usted (RF-24): correo, contraseña, perfil y PIN de cada uno, y el vencimiento | **WhatsApp busca en el texto, no dentro de las fotos**: así el correo se encuentra buscando en el chat. Y la contraseña no queda en una foto, que se reenvía y se guarda en la galería |

Cómo se abre WhatsApp:

- **Celular:** el menú de compartir del teléfono (Web Share API con la imagen como archivo y
  el mensaje como texto). El dueño elige WhatsApp y el chat.
- **Escritorio:** `wa.me/<número>?text=…` abre el chat con el mensaje escrito, y la imagen
  se copia al portapapeles (o se descarga) para pegarla.
- **Sin verificar:** si WhatsApp respeta el texto cuando se comparte junto con una imagen
  (en algunos teléfonos solo pasa la imagen). Se prueba en la porción 3; si no pasa, se
  manda primero la imagen y luego el mensaje con `wa.me`.

### Pagos a medias en el historial (2026-11-06)

El historial muestra **un** «Pagó el» por alquiler: cada alquiler guarda el día de su
último pago (`paid_on`). Si pagó S/ 5 un día y el resto otro, solo queda el último. Ver cada
abono por separado necesita la tabla de pagos (sección 6, «Finanzas»): se hace cuando haya
abonos seguidos de verdad, con su migración y conservando los datos.

## 11. Al terminar

- Pasar los acuerdos a [alquileres](../negocio/alquileres.md) y actualizar
  [modelo](../negocio/modelo.md) (alquiler sin cabecera; finanzas).
- Pasar `SwipeRow` y la hoja de acciones a [componentes](../diseno/componentes.md).
- Mostrar de nuevo los perfiles en el detalle de la cuenta (`ARE_PROFILES_SHOWN`), con
  quién tiene cada uno.
- Comandos (los corre Thony): `pnpm db:generate`, `pnpm db:migrate:local`,
  `pnpm --filter server test`, `pnpm check-types`.

## 12. Preguntas para Thony

**Respondidas (2026-10-31):**

1. Listado: **una fila por cliente**; sus perfiles son los productos de la orden y se ven en
   el detalle.
2. Una vez vencido, **el perfil sigue ocupado** hasta renovar o liberar.
3. Mensajes de **por vencer** y **vencido**: los textos de RF-21 y RF-22.
4. Estado: **color por perfil**, como badge (RF-14 en la fila, RF-17 en el detalle).
5. Deslizar a la izquierda: **libre** por ahora.

**Respondidas (2026-11-01):**

6. Finanzas: sin tabla de pagos mientras haya un solo tipo de ingreso y un solo método (Yape).
7. Mensajes **de usted**.
8. Pago al alquilar; «por cobrar» solo con fecha prometida. Los pagos a medias se editan.
9. Cambiar accesos en la misma cuenta, con historial; va en el 4c.
10. Clientes al menú lateral; Alquileres a la barra inferior.

**Respondidas (2026-11-04):**

11. Fila: un solo badge de estado y el monto solo cuando toca cobrar (RF-13b).
12. Mensaje de accesos: lo propone Claude (RF-24).
13. Dos perfiles sueltos del mismo correo: se agrega un perfil a la cuenta.

Sin preguntas abiertas.
