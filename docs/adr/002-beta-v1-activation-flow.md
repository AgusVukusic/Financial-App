# ADR 002: Flujo de Activación Beta V1

## Contexto
El producto será lanzado como una Beta privada (Friends & Family). Aunque Firebase Auth maneja el registro mediante email y contraseña, no queremos que cualquier usuario que descubra la aplicación pueda acceder o escribir datos sin autorización.

## Decisión
Se implementará una puerta de acceso server-side utilizando una validación basada en invitaciones.
1. **Colección `betaInvites`**: Contendrá los correos electrónicos normalizados (lowercase, trim) como ID de documento de los usuarios invitados. Esta colección es invisible e inescribible para los clientes (`allow read, write: if false`).
2. **Perfil `users/{uid}`**: Los perfiles activos se guardarán aquí. El cliente solo podrá leer su propio perfil.
3. **Callable Function `activateBetaUser`**: Es la única entidad capaz de validar si un usuario autenticado y con correo verificado se encuentra en la colección `betaInvites` y, de ser así, crear su documento en `users` de forma atómica.

## Limitaciones Conocidas
- **Cuentas Auth huérfanas**: Un usuario no invitado podría llegar a crear una cuenta en Firebase Auth si encuentra los endpoints, pero jamás logrará pasar de la pantalla de activación, ya que la función `activateBetaUser` lo rechazará y las reglas de Firestore le impedirán crear cuentas o transacciones.
- **Carga de Invitaciones**: Durante la Beta V1, los administradores cargarán los correos en `betaInvites` directamente desde la consola de Firebase o mediante scripts de administración antes del lanzamiento, ya que no existirá UI de administración de invitaciones.

## Consideraciones de Seguridad
- La función de activación confía únicamente en el token JWT proveído y validado por Firebase (vía `request.auth`), nunca en un payload ingresado por el usuario.
- El requisito de verificación de correo evita el secuestro de invitaciones.
- Se asegura la idempotencia para evitar duplicación o corrupción del perfil de usuario ante reintentos de red.
