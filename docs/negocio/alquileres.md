# Alquileres

## Regla central (acordada)

Al crear un alquiler, sus perfiles pasan a **no disponibles**. Al liberarlo, vuelven a
**disponibles**. Nunca puede quedar un perfil alquilado a dos clientes a la vez.

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

## Por definir al llegar a esta etapa

- Renovar una línea: ¿crea un alquiler nuevo con ese perfil o alarga la línea? (Propuesta:
  un alquiler nuevo, igual que las compras de la cuenta, así queda el historial de lo cobrado.)
- Qué es un **combo** exactamente (varios servicios a un precio).
- **Promociones** (quedaron para después el 2026-10-12).
