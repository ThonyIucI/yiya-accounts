# Usuarios

No hay registro público: el **superadmin** crea a cada usuario y le pasa su correo y su
contraseña.

| Rol | Quién | Qué ve |
|---|---|---|
| `SUPERADMIN` | Tú. Se crea con `seed-superadmin` (ver [despliegue.md](despliegue.md)) | Panel + **Usuarios** |
| `USER` | El dueño o ayudante de un negocio | Panel |

## Dar acceso a un cliente

1. Entra con tu superadmin → **Usuarios** → **Nuevo usuario**.
2. Nombre, correo y una contraseña de al menos 8 caracteres.
3. Pásale el correo, la contraseña y la URL de la web.

API: `GET /api/v1/users` y `POST /api/v1/users`, las dos solo para el superadmin.

Por ahora el usuario entra a un panel vacío. Cuando existan los negocios, se le asigna el suyo.
