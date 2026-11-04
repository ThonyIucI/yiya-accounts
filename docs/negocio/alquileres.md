# Alquileres

## Regla central (acordada)

Al crear un alquiler, sus perfiles pasan a **ocupados**. Al liberarlo, vuelven a
**libres**.

**Un perfil se puede compartir** (Thony, 2026-10-31; reemplaza «nunca dos clientes a la
vez»): cuando hay mucha demanda, un mismo perfil se presta por un tiempo a más de un
cliente, y una cuenta de 5 perfiles puede tener más de 5 clientes. El sistema lo avisa al
elegir el perfil, pero **no lo impide**.

**Cada perfil alquilado vence por su lado** (Thony, 2026-10-31): un cliente puede tener
perfiles de distintas cuentas, alquilados en distintos días, y cada uno lleva su propio
contador.

## Planes (acordado 2026-10-12, se implementa después)

Cómo vende hoy el cliente:

- Lo normal es **mensual**.
- También vende por **3 meses, 6 meses y 1 año**, según los perfiles.
- Hay clientes finales que compran **más de una cuenta** de streaming.

**Decisión:** esa complejidad se resuelve **después**, de forma modular. Primero se arma
el inventario (servicios, cuentas, perfiles); los planes y las compras de varias cuentas se
diseñan cuando lleguemos a alquileres, sin rehacer lo anterior.

## Respondido por Thony (2026-10-22)

1. **Precio y tiempo propios en cada alquiler.** El precio de venta del servicio es
   **referencial** (cambia cuando hay promociones) y solo llena el campo. Cada alquiler
   guarda **su** precio y **su** tiempo, que puede ser personalizado (no solo 1, 3, 6 o 12
   meses), con el descuento que se haya dado. No hay fórmula «mensual × meses».
2. **Un alquiler con varias líneas**, como una venta de id-pos con sus productos. Cada
   línea es **un perfil**, con su propio inicio, vencimiento y precio. Así entra en una sola
   operación el cliente que lleva Max por 3 meses, Disney+ por 1 año y Netflix por 1 mes, y
   también el que lleva dos perfiles de la misma cuenta. Cada línea vence y se renueva por su
   lado; el total del alquiler es la suma de sus líneas.
3. **Clientes antes que alquileres.** Cada cliente final tiene su ficha (nombre, WhatsApp,
   nota) y su detalle con lo que tiene alquilado. El módulo de alquileres es como **Ventas**
   de id-pos: se elige el cliente y se agregan perfiles.

## El cliente es la orden (Thony, 2026-10-31)

Cada perfil alquilado es un **producto** de la orden del cliente: alquilarle otro perfil es
agregar un producto. El listado de alquileres va **una fila por cliente** (nombre, logos de
sus servicios con su estado y su vencimiento más cercano), y el detalle de cada perfil se ve
al abrirlo. Reemplaza la fila por alquiler con código `AL-000012` de la propuesta de abajo.
Un perfil vencido **sigue ocupado** hasta que se renueva o se libera. Detalle en el
[ERS del 4b](../planes/04b-alquileres.md).

## Lo que se compra y lo que se vende, en vistas separadas (acordado 2026-10-22)

**Cuentas** es lo que el negocio le compra al proveedor; **Alquileres** es lo que le vende
al cliente. Los perfiles y su estado (libre, alquilado, a quién) **no vuelven a la vista de
cuentas**: viven en Alquileres, para no mezclar las dos cosas ni cargar la card.

Propuesta para revisar, tomada del reporte de órdenes de id-pos (`/reports/orders-v2`):

- **Listado de alquileres**, una fila por alquiler como una orden: código (`AL-000012`),
  cliente, servicios (logos de sus líneas), monto total, a cobrar, vence (la línea que vence
  primero, con los colores de las cuentas) y fecha. En celular, la card de orden de id-pos:
  fecha arriba, cliente como título, «servicios · código» debajo y monto, a cobrar y vence
  en dos columnas.
- **Enviar (▷)**, como en id-pos: copia el mensaje con el acceso de cada línea (correo,
  contraseña, perfil, PIN y vencimiento), listo para WhatsApp.
- **`⋯`:** Renovar, Cobrar y Liberar.
- **Detalle con pestañas**, como el de la orden: *Perfiles* (las líneas), *Cobros*, *Datos*.
- **Filtros:** fecha, estado (vigente, por vencer, vencido), servicio y cliente. Lo de id-pos
  que no aplica (caja, comprobantes, moneda, zonas, vendedor) no se copia.
- **«Seleccionar» en lote** queda para después (por ejemplo, mandar varios avisos juntos).
- Los perfiles se **eligen** al armar el alquiler: el select muestra solo los libres de ese
  servicio, agrupados por cuenta. El nombre y el PIN se siguen editando en el detalle de la
  cuenta, en una pestaña *Perfiles* aparte (la configuración es de la cuenta).

## Por definir al llegar a esta etapa

- ¿Se registra **lo cobrado** (pagado / por cobrar, como «Monto a cobrar» de id-pos) o se
  asume que se cobra al alquilar?

- Renovar una línea: ¿crea un alquiler nuevo con ese perfil o alarga la línea? (Propuesta:
  un alquiler nuevo, igual que las compras de la cuenta, así queda el historial de lo cobrado.)
- Qué es un **combo** exactamente (varios servicios a un precio).
- **Promociones** (quedaron para después el 2026-10-12).
