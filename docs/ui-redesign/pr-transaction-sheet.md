## Anotar, editar y ver movimientos (fase 4: hojas de formulario + lista de Movimientos)

> **Qué cambia en producción al mergear:** los dos modales (movimiento y cuenta) pasan a **hojas inferiores accesibles**, la carga de un
> gasto cambia (monto primero, categorías como botones, fecha y descripción plegadas) y la lista de **Movimientos** se rehace: cada renglón
> es un solo botón que abre la edición y **eliminar pasa a estar dentro de la hoja**, con confirmación. Además el campo de monto ahora
> entiende costumbres argentinas (ver "Un riesgo que se corrigió"). La lógica de guardado, los `requestId` y los textos de éxito/error no cambian.
> No toca `functions/`, `api/`, `firestore.rules`, `src/services/api.js`, `money.js`, `mappers.js` ni lo que devuelven los hooks.
> Es un solo PR (hojas + lista) porque la lista abre la hoja de edición y comparten `App.jsx`.

### Un riesgo que se corrigió: "1.500" se guardaba como $1,50
Con `type="number"`, en un teléfono en español el navegador lee `3,5` como 3,5 pero **`1.500` como 1,5**. Probado en el navegador con el
idioma es-AR. Ahora el monto es texto con teclado decimal y `parseAmountInput` (función pura con 29 pruebas) entiende `3500`, `3,5`,
`1.500` (miles), `2.500,50` y `$ 12.000`; lo que no es un monto se rechaza con un mensaje junto al campo. Probado de punta a punta: tipear
`1.500` bajó el saldo exactamente $1.500. Lo mismo para el saldo inicial de una cuenta.

### Qué cambia
- **Movimiento**: título "Nuevo/Editar movimiento"; tipo (Gasto / Ingreso / Transferencia) en tres botones; **monto grande con foco al abrir**
  (`inputmode="decimal"`); categoría en botones (todas a la vista); cuenta en lista; **Fecha y descripción plegadas** (abiertas al editar);
  botón de guardar siempre visible. Con la hoja abierta alcanza para anotar un gasto en 3 toques: monto, categoría, guardar (o Enter).
- **Transferencia**: origen y destino apilados (antes el destino quedaba fuera de pantalla a 375 px) y error junto al campo si son iguales.
- **Cuenta**: nombre, tipo en botones con ícono y saldo inicial (bloqueado al editar, con explicación); **Eliminar** sigue pidiendo confirmación.
- **Accesibilidad**: `role="dialog"`, foco atrapado y devuelto, Escape y botón Cerrar visible, el fondo no se desplaza; validación en el campo
  con ícono y texto (no solo color) en lugar de avisos sueltos. Una confirmación abierta sobre una hoja atiende Escape sola (pila de diálogos).
- **Movimientos**: título "Movimientos" con el total del mes; renglón de una sola pieza (ícono, título hasta 2 líneas, `14 nov · Categoría · Cuenta`,
  monto); gasto en tinta neutra con signo −, ingreso con + y color, **transferencia con ⇄ y "origen → destino"** (nombres de cuentas); 20 renglones y
  "Ver los N restantes"; estado vacío con "Anotar el primero". Se acabaron los dos íconos de 24 px por fila.
- **Eliminar** dentro de la hoja de edición (botón rojo + confirmación "Eliminar"). Probado en el emulador: saldo +$21.000, el renglón desaparece y el aviso lo confirma.
- Mismas props que antes (`isOpen`, `onClose`, `onAdd`, `onEdit`, `onDelete`, `initialData`, `accounts`) más `onDelete` en el modal de movimiento (`App.jsx` solo pasa `accounts`, `onOpenAdd` y `onDelete`).

### Antes / después
Antes (auditoría): `docs/ui-redesign/audit/06-modal-gasto-oscuro.jpg`, `08-dashboard-lista-oscuro.jpg`, `17-transferencia-desborde.jpg`.
Después: `docs/ui-redesign/sheets/` (nuevo, guardado con aviso, transferencia con y sin error, editar movimiento, editar cuenta) y `docs/ui-redesign/transactions/` (lista oscura y clara, transferencia, descripción larga, eliminar con confirmación), todo a 393 px.

### Cómo probarlo
Preview de Vercel de la rama, o local con emuladores y el seed (ver `CLAUDE.md`). En Inicio, **Anotar**: escribí un monto, tocá una categoría y Enter.

### Verificación
`npm run lint` (0 errores), `npm test` (164 pruebas: formularios, lista, parser de montos), `npm run build`. Probado a 393 px (iPhone 15) y escritorio,
claro y oscuro: carga de un gasto con teclado, transferencia con error, edición de movimiento y de cuenta. **No probado en Safari ni en un iPhone real**
(en iOS el foco automático del monto depende de que la apertura sea un gesto del usuario).

### Pendiente
Borrados (ya no se importaban): `src/App.css`, `src/components/AddTransactionModal.css`, `src/components/TransactionList.css`. `GroupDetails.jsx` (fuera de la Beta) usaba `.modal-overlay` de ese CSS; necesita su propio rediseño si vuelve.
Siguiente: Reportes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
