# Usuarios y negocios

No hay registro público: el **superadmin** crea a cada usuario, le asigna su negocio y le pasa
su correo y su contraseña.

| Rol de plataforma (`user.role`) | Quién | Qué ve |
|---|---|---|
| `SUPERADMIN` | Tú. Se crea con `seed-superadmin` (ver [despliegue](../tecnico/despliegue.md)) | Panel, **Negocios**, **Usuarios** |
| `USER` | El dueño (o, más adelante, ayudante) de un negocio | Panel de su negocio |

**El superadmin ve todo; el dueño, solo su negocio** (acordado 2026-10-12). El superadmin
**siempre está dentro de un negocio** (por defecto, el primero de la lista), lo cambia
desde un select en su menú lateral y ahí hace todo lo que haría el dueño. Solo queda sin
negocio cuando no existe ninguno. La elección queda guardada aunque vuelva a entrar.

El rol **dentro** del negocio va en la membresía: `OWNER` (dueño) o `HELPER` (ayudante, aún
sin uso). Un usuario pertenece a un solo negocio.

## Dar acceso a un cliente

1. **Usuarios** → **Crear**: nombre, correo y contraseña (mínimo 8 caracteres).
2. **Negocios** → **Crear**: nombre del negocio y, como dueño, el usuario del paso 1. Solo
   aparecen los usuarios que todavía no tienen negocio.
3. Pásale el correo, la contraseña y la URL de la web.

Si el cliente entra sin negocio asignado, ve un aviso que le pide pedir acceso.

## Quitar el acceso

**Negocios** → apaga el switch del negocio. Su dueño deja de entrar a todo lo del negocio;
no se borra nada. Al volver a encenderlo, entra de nuevo.

## API

| Ruta | Quién |
|---|---|
| `GET /api/v1/users`, `POST /api/v1/users` | superadmin |
| `GET /api/v1/businesses`, `POST /api/v1/businesses`, `PATCH /api/v1/businesses/:id` | superadmin |
| `GET /api/v1/my-business` | dueño con negocio activo, o superadmin (el negocio que eligió) |
| `PUT /api/v1/me/active-business` | superadmin: cambia de negocio |
