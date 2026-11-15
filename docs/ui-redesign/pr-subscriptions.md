# feat(ui): Gastos fijos con el sistema "Panel de taller"

## Qué cambia en producción

- **Pagar en un paso** (hallazgo 11): una sola confirmación, no destructiva ("Pagar", botón de acento, no rojo). El resultado es un aviso "Pagado: Netflix $ 13.999" con **Deshacer**; ya no aparece el segundo diálogo "Aviso / Entendido".
- **Deshacer un pago**: anula el movimiento con el mismo `requestId` del pago (`voidTransaction`). El servidor ya devolvía el saldo y `lastPaidAt` a como estaban; no se tocó la capa de datos.
- **Lista por vencimiento** con estado en texto + ícono: "Venció hace 1 día", "Vence en 3 días", "Vence hoy", "Pagado este mes" (solo si el último pago cae en el mes en curso) o "Vence el 24/11". Sin tarjetas con borde lateral de color; plural corregido ("1 día").
- **Cada renglón es un botón** que abre la edición; "Pagar" es un botón aparte y solo aparece si está vencido o vence en 5 días o menos. Mientras un pago está en curso no se puede lanzar otro.
- **Alta y edición en una hoja** (`Sheet`): monto con `parseAmountInput` ("1.500" = 1500), día del mes en un selector de 1 a 31, errores inline. Con una sola cuenta, viene preseleccionada. Sin cuentas, la hoja ofrece "Crear una cuenta".
- **Eliminar** va dentro de la hoja de edición, con confirmación destructiva que aclara que los pagos ya registrados no se borran. Antes se borraba con un toque en un ícono de 18 px, sin confirmar.
- Copy en voseo ("Anotá tu primer gasto fijo"), sin estilos inline.

No se tocaron `functions/`, `api/`, reglas, `services/api.js`, `money.js`, `mappers.js`, `subscriptionUtils.js` ni los hooks. `App.jsx` solo pasa dos props (`onDeleteTransaction`, `onAddAccountClick`).

## Antes / después

| | Antes | Después |
|---|---|---|
| Lista | `audit/14-gastos-fijos.jpg` | `subscriptions/01-lista-oscuro-393.jpg`, `subscriptions/05-claro-320-nombre-largo.jpg` |
| Pagar | `audit/15-pago-confirmar.jpg`, `audit/16-pago-aviso-bloqueante.jpg` | `subscriptions/02-confirmar-pago.jpg`, `subscriptions/03-pagado-deshacer.jpg` |
| Alta / edición | (formulario inline) | `subscriptions/04-hoja-editar.jpg` |
| Escritorio | — | `subscriptions/06-escritorio-claro.jpg` |

(Rutas relativas a `docs/ui-redesign/`.)

## Cómo probarlo

1. Preview de Vercel → Inicio → "Gestionar" en Para pagar.
2. "Pagar" en un gasto vencido → confirmar → el renglón pasa a "Pagado este mes" y baja en la lista.
3. "Deshacer" en el aviso (8 s) → vuelve a "Venció hace…" y el saldo de la cuenta queda como antes.
4. Tocar un renglón → cambiar el monto → "Guardar cambios".
5. "Nuevo gasto fijo" → guardar vacío para ver los errores → completar → después eliminarlo desde su hoja.

## Verificación

- `npm run lint` (0 errores, 9 avisos conocidos), `npm test` (250 pruebas; 33 nuevas de Gastos fijos) y `npm run build`: pasan.
- Contra el emulador, leyendo Firestore antes y después: pagar Netflix bajó el saldo de la cuenta en $ 13.999 y puso `lastPaidAt`; Deshacer devolvió el saldo exacto, dejó `lastPaidAt` en `null` y creó el documento `void_…`. También editar monto, alta, error del servidor (la hoja queda abierta) y eliminar.
- Navegador integrado: oscuro a 393 px, claro a 320 px y 1100 px. Sin scroll horizontal, ningún control de menos de 44 px, foco de vuelta al renglón al cerrar la hoja, Escape cierra solo la confirmación cuando está sobre la hoja.
- Casos extremos a mano: nombre de 80 caracteres, monto de 12 dígitos (el total achica la letra para no partirse a 320 px). No se corrió la skill `break-ui`.

## No probado / límites

- Safari, iPhone real y lector de pantalla. No crucé todas las combinaciones de tema y ancho.
- "Crear una cuenta" desde la hoja (usuario sin cuentas): cubierto en pruebas, no en el navegador.
- Deshacer solo está disponible mientras dura el aviso (8 s). Después, el pago se anula desde Movimientos, como cualquier gasto.
- Heredado de `subscriptionUtils` (no se tocó): los gastos anuales calculan su vencimiento como si fueran mensuales.
- **Para decidir:** las categorías de Gastos fijos (Entretenimiento, Servicios, Software, Hogar, Transporte, Otros) no son las 6 de la app. Un pago de "Entretenimiento" o "Software" queda fuera de los topes y en Reportes se suma a "Otros". No se cambió la lista.
- A 320 px el botón "Pagar" baja a un renglón propio.
- Queda sin uso `src/components/SubscriptionsManager.css` (ya no se importa): se borra con OK.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
