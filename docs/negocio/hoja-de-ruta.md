# Hoja de ruta

Acordada el 2026-10-12. Cada paso se despliega solo, en este orden: el cliente puede usar
uno sin esperar al siguiente.

| # | Etapa | Estado |
|---|---|---|
| 0 | Stack nuevo, deploy y acceso del primer cliente | Hecho |
| 1 | **Negocios y membresías**: el superadmin crea el negocio y le asigna su dueño | Hecho en código; falta desplegar |
| 2 | **Servicios y precios**: catálogo global; cada negocio pone su precio | Hecho en código; falta probar y desplegar · [ERS](../planes/02-servicios-y-precios.md) · [acuerdos](servicios-y-precios.md) |
| 3 | **Inventario**: proveedores, cuentas (contraseña cifrada) y perfiles | Proveedores, cuentas, perfiles, compras y renovaciones hechos en código (2026-10-22); falta desplegar · [ERS](../planes/03-inventario.md) |
| 4a | **Clientes finales**: la ficha de cada cliente y su detalle (2026-10-22: va antes que los alquileres) | CRUD y detalle probados; navegación en código (2026-10-31), falta probar. Sigue el select (puede ir en el 4b) · [ERS](../planes/04a-clientes.md) |
| 4b | **Alquileres**: como Ventas de id-pos, un alquiler con una línea por perfil ([alquileres](alquileres.md)) | ERS revisado (2026-11-04). Porción 1 (CRUD) en código (2026-11-04), falta probar · [ERS](../planes/04b-alquileres.md) |
| 5 | **Panel**: qué vence pronto, perfiles libres, margen | — |

Después: combos, ayudantes con permisos, avisos de vencimiento por WhatsApp e identidad
visual propia.

## Refactors pendientes (anotados 2026-10-31)

No son un paso propio: se hacen entre pasos, cuando Thony lo decida.

| Refactor | Qué | Por qué |
|---|---|---|
| **Tablas en plural** | Renombrar las tablas que hoy están en singular (`provider`, `streaming_account`, `profile`, `account_purchase`, `business`, `membership`, `service`) y las de better-auth (`user`, `session`, `account`, `verification`, con su opción de nombres en plural). Las intermedias (`business_service`) quedan en singular. En una migración propia que renombra **conservando los datos** | La regla de [convenciones](../tecnico/convenciones.md) (2026-10-30) llegó después de esas tablas |
| **Modo oscuro como el de Telegram** | Rehacer los colores del modo oscuro en `packages/ui/src/styles/globals.css`, tomando de referencia el de Telegram, y revisar el contraste de badges y vencimientos | El modo oscuro actual no es agradable (Thony, 2026-10-31) |
