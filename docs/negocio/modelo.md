# Modelo del negocio

Yiya es para negocios que **alquilan perfiles de cuentas de streaming** (Netflix,
Disney+…). Cada negocio compra cuentas a proveedores, alquila sus perfiles a clientes
finales y necesita saber qué perfil está libre, a quién se alquiló, cuándo vence y cuánto
gana.

## Entidades

```
Negocio ──< Proveedor ──< Cuenta ──< Perfil >── Alquiler >── Cliente final
                            │                      │
                     Servicio (global)           Combo
```

| Entidad | Qué es | Acuerdos |
|---|---|---|
| Negocio | Cada cliente de Yiya | Lo crea el superadmin. No se borra: se desactiva. Ver [negocios-y-usuarios](negocios-y-usuarios.md) |
| Servicio | Netflix, Disney+… | Catálogo **global**, común a todos los negocios. Cada negocio pone **sus** precios |
| Proveedor | A quién le compra cuentas el negocio | — |
| Cuenta | Correo + contraseña de la plataforma, precio de compra, fechas de compra y vencimiento | La contraseña se guarda **cifrada**, nunca en texto plano |
| Perfil | La unidad que se alquila (nombre, PIN, precio, disponible) | — |
| Cliente final | Quien alquila | Es un registro del negocio, **no** entra a Yiya |
| Alquiler | Perfiles de un cliente por un período | Ver [alquileres](alquileres.md) |

## Reglas que valen para todo

- **Cada negocio ve solo sus datos.** Ningún negocio puede ver ni tocar lo de otro.
- **Precios en céntimos enteros** (S/ 15.50 se guarda como `1550`), nunca con decimales.
- **No hay registro público.** Los negocios y sus dueños los da de alta Thony (superadmin).
- Hoy el cliente **no tiene equipo**: solo entra el dueño. El rol de ayudante existe en el
  modelo pero sin pantallas, hasta que haga falta.
