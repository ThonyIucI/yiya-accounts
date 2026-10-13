# Servicios y precios

Acordado el 2026-10-12. El detalle de lo que se construyó está en la
[ERS del paso 2](../planes/02-servicios-y-precios.md).

## Reglas

- **El catálogo es global** y lo mantiene el superadmin: nombre, perfiles por cuenta y link
  de imagen (un PNG alojado afuera, opcional). Un negocio no crea servicios: los pide.
- **Crear un servicio no lo activa en ningún negocio.** Cada negocio activa los que trabaja.
- **Dos precios por servicio y negocio**, en soles con dos decimales:

  | Precio | Qué es | Ejemplo |
  |---|---|---|
  | Compra | Lo que le cuesta **una cuenta** al negocio | S/ 20.00 |
  | Venta | A cuánto alquila **un perfil por un mes** | S/ 7.50 |

- **El precio de compra del servicio es referencial** (acordado 2026-10-12): una misma
  plataforma se compra a varios proveedores y a precios distintos. El real lo guarda cada
  cuenta; el del servicio solo llena el campo al registrarla
  ([ERS del paso 3](../planes/03-inventario.md)).
- **Sin los dos precios no se activa**: al activar se piden (o confirman) los dos en una
  ventana y recién al confirmar queda activo. Los precios solo se ven y se editan mientras
  el servicio está activo. A un servicio activo no se le puede borrar
  un precio. Desactivar no borra los precios.
- **Solo se venden perfiles**, nunca cuentas completas.
- Perfiles por cuenta: entero desde 1, sin tope. Es el valor por defecto para las cuentas.
- Cambiar un precio vale para lo que se registre después; lo ya alquilado no cambia.

## Quién hace qué en **Servicios**

| | Superadmin | Dueño |
|---|---|---|
| Crear y editar servicios | Sí | No |
| Activar y poner precios | En el negocio elegido en su menú lateral | En su negocio |
| Ve en cuántos negocios está activo cada uno | Sí | No |

## Pendiente con el cliente

- Confirmar el catálogo inicial y cuántos perfiles vende de verdad por cuenta.
- Promociones y planes de 3, 6 y 12 meses: paso 4 ([alquileres](alquileres.md)).
