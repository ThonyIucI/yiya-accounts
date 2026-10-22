# Hoja de ruta

Acordada el 2026-10-12. Cada paso se despliega solo, en este orden: el cliente puede usar
uno sin esperar al siguiente.

| # | Etapa | Estado |
|---|---|---|
| 0 | Stack nuevo, deploy y acceso del primer cliente | Hecho |
| 1 | **Negocios y membresías**: el superadmin crea el negocio y le asigna su dueño | Hecho en código; falta desplegar |
| 2 | **Servicios y precios**: catálogo global; cada negocio pone su precio | Hecho en código; falta probar y desplegar · [ERS](../planes/02-servicios-y-precios.md) · [acuerdos](servicios-y-precios.md) |
| 3 | **Inventario**: proveedores, cuentas (contraseña cifrada) y perfiles | Proveedores, cuentas y perfiles hechos en código; faltan compras y renovaciones · [ERS](../planes/03-inventario.md) |
| 4a | **Clientes finales**: la ficha de cada cliente y su detalle (2026-10-22: va antes que los alquileres) | — |
| 4b | **Alquileres**: como Ventas de id-pos, un alquiler con una línea por perfil ([alquileres](alquileres.md)) | — |
| 5 | **Panel**: qué vence pronto, perfiles libres, margen | — |

Después: combos, ayudantes con permisos, avisos de vencimiento por WhatsApp e identidad
visual propia.
