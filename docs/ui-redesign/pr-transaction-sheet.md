## Anotar un movimiento y editar cuentas en hojas inferiores (fase 4: modales)

> **Qué cambia en producción al mergear:** los dos modales (nuevo/editar movimiento y nueva/editar cuenta) pasan a una **hoja
> inferior accesible**. Cambia cómo se carga un gasto: monto primero con teclado decimal, categorías como botones, fecha y descripción
> plegadas. La lógica de guardado, los `requestId` de idempotencia y los textos de éxito/error no cambian. No toca `functions/`, `api/`,
> `firestore.rules`, `src/services/api.js`, `money.js`, `mappers.js` ni lo que devuelven los hooks.

### Qué cambia
- **Movimiento**: título "Nuevo/Editar movimiento"; tipo (Gasto / Ingreso / Transferencia) en tres botones; **monto grande con foco al abrir**
  (`inputmode="decimal"`); categoría en botones (todas a la vista); cuenta en lista; **Fecha y descripción plegadas** (abiertas al editar);
  botón de guardar siempre visible. Con la hoja abierta alcanza para anotar un gasto en 3 toques: monto, categoría, guardar (o Enter).
- **Transferencia**: origen y destino apilados (antes el destino quedaba fuera de pantalla a 375 px) y error junto al campo si son iguales.
- **Cuenta**: nombre, tipo en botones con ícono y saldo inicial (bloqueado al editar, con explicación); **Eliminar** sigue pidiendo confirmación.
- **Accesibilidad**: `role="dialog"`, foco atrapado y devuelto, Escape y botón Cerrar visible, el fondo no se desplaza; validación en el campo
  con ícono y texto (no solo color) en lugar de avisos sueltos. Una confirmación abierta sobre una hoja atiende Escape sola (pila de diálogos).
- Mismas props que antes (`isOpen`, `onClose`, `onAdd`, `onEdit`, `onDelete`, `initialData`, `accounts`): `App.jsx` no cambia.

### Antes / después
Antes (auditoría): `docs/ui-redesign/audit/06-modal-gasto-oscuro.jpg`, `17-transferencia-desborde.jpg`.
Después: `docs/ui-redesign/sheets/` (393 px claro y oscuro: nuevo, guardado con aviso, transferencia con y sin error, editar movimiento, editar cuenta).

### Cómo probarlo
Preview de Vercel de la rama, o local con emuladores y el seed (ver `CLAUDE.md`). En Inicio, **Anotar**: escribí un monto, tocá una categoría y Enter.

### Verificación
`npm run lint` (0 errores), `npm test` (119 pruebas, 15 nuevas de los formularios), `npm run build`. Probado a 393 px (iPhone 15) y escritorio,
claro y oscuro: carga de un gasto con teclado, transferencia con error, edición de movimiento y de cuenta. **No probado en Safari ni en un iPhone real**
(en iOS el foco automático del monto depende de que la apertura sea un gesto del usuario).

### Pendiente
`src/components/AddTransactionModal.css` y `src/App.css` quedaron sin uso (ya no se importan). Siguiente pantalla: Movimientos (`TransactionList`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
