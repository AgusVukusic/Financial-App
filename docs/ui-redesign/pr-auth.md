# feat(ui): Landing, ingreso y activación con el sistema "Panel de taller" + arreglo del login

## Qué cambia en producción

- **Arreglo del login tras verificar el correo (hallazgo 7).** Quien intentaba ingresar antes de verificar, verificaba y volvía a tocar "Ingresar", no entraba hasta recargar, y el aviso de error no se iba.
  - Causa (reproducida en el emulador): con el correo sin verificar la sesión de Firebase quedaba abierta; el segundo ingreso devolvía el usuario ya verificado, pero como el uid no cambiaba, `onAuthStateChanged` no volvía a dispararse y la app nunca lo recibía. No era `user.reload()`, como suponía el traspaso.
  - Arreglo, solo en `WelcomeScreen.jsx`: si el correo no está verificado se cierra esa sesión. "Reenviar correo" vuelve a ingresar con lo que está en el formulario, manda el correo y cierra; si en ese momento ya está verificado, entra directo. `useUser` no se tocó.
- **Errores en texto humano (hallazgo 16):** `utils/authErrors.js` traduce los códigos de Firebase ("El correo o la contraseña no coinciden.", "Sin conexión. Revisá internet y probá de nuevo."…). Ya no se muestra "Firebase: Error (auth/…)".
- **Landing (hallazgo 25):** "Ingresar" es la acción principal; "Instalar la app" es secundaria y solo aparece si no está instalada. Las instrucciones de instalación van en una `Sheet` accesible (antes un `div` con `onClick`). Copy corto, sin marketing.
- **Ingreso / registro:** campos con `Field`/`Input` (16 px, sin zoom en iOS), `autocomplete` correcto, mostrar/ocultar contraseña, validación inline con foco en el primer error, avisos dentro de la pantalla ("Te enviamos un correo a…", "Tu correo todavía no está verificado…") con "Reenviar correo". En el registro se aclara que la Beta es por invitación.
- **Activación:** mismos estados y lógica; el caso denegado muestra el correo y a quién pedirle la invitación.
- **Título de la pestaña:** "Finanzas Personales" antes de ingresar (decía "Dashboard - Financial App") y "Inicio · Finanzas Personales", "Reportes · …" adentro.
- **ErrorBoundary y pantalla de carga** pasados a tokens.
- Todas estas pantallas dejan de usar `position: fixed` con `z-index: 9999` (tapaba los avisos), estilos inline, emoji y alias legados.

No se tocaron `functions/`, `api/`, reglas, `firebase.js`, `services/api.js` ni ningún hook (`useUser`, `useBetaAccess`, `usePWA`).

## Antes / después

| | Antes | Después |
|---|---|---|
| Landing | `audit/01-landing-375.jpg` | `auth/01-landing-claro-393.jpg`, `auth/06-instalar-oscuro-320.jpg` |
| Error de ingreso | `audit/02-registro-error-crudo.jpg` | `auth/02-login-errores.jpg` |
| Sin verificar | `audit/03-login-sin-verificar.jpg` | `auth/03-registro-ok-aviso.jpg`, `auth/04-sin-verificar.jpg` |
| Activación rechazada | `audit/04-activacion-rechazada.jpg` | `auth/05-activacion-denegada.jpg` |
| Registro | — | `auth/07-registro-oscuro-320.jpg` |

(Rutas relativas a `docs/ui-redesign/`.)

## Cómo probarlo

1. Preview de Vercel en una ventana privada: la pestaña dice "Finanzas Personales" y el botón principal es "Ingresar".
2. Ingresar con una contraseña mal: mensaje en castellano, sin "Firebase:".
3. Crear una cuenta con un correo invitado → intentar ingresar antes de verificar → verificar desde el correo → volver y tocar "Ingresar" **sin recargar**: entra.
4. Con un correo no invitado: pantalla "Tu correo no está invitado" con el correo y "Cerrar sesión".

## Verificación

- `npm run lint` (0 errores, 9 avisos conocidos), `npm test` (300 pruebas; 27 nuevas) y `npm run build`: pasan. `ActivationScreen.test.jsx` quedó intacta; en `ErrorBoundary.test.jsx` cambió el nombre del botón ("Recargar").
- **Bug reproducido y arreglado en el emulador:** antes del cambio, registro → ingreso sin verificar → verificación → "Ingresar" se quedaba en el login. Después del cambio, el mismo recorrido con un usuario nuevo entra a Inicio sin recargar (pasando por la activación).
- También en el emulador: contraseña incorrecta, registro con aviso, activación denegada para un correo sin invitación, cierre de sesión.
- Navegador integrado a 393 px (claro) y 320 px (oscuro): sin scroll horizontal, ningún control de menos de 44 px, la hoja de instalación cierra con Escape, mostrar/ocultar contraseña cambia el tipo del campo.

## No probado / límites

- **"Reenviar correo" no se probó en el navegador** (sí en pruebas con Firebase simulado). Tampoco el error "sin conexión" real.
- La instalación real de la PWA (el aviso de Chrome/Android y los pasos en Safari de iOS): solo vi la hoja de instrucciones genérica.
- Escritorio (1100 px) no se revisó en estas pantallas; ErrorBoundary solo en pruebas.
- Safari, iPhone real y lector de pantalla.
- Después de registrarse la contraseña se vacía: para "Reenviar correo" hay que volver a escribirla.
- Estas pantallas ya no tienen animación de entrada.
- Queda sin uso `src/components/LandingPage.css` (borrar con OK).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
