## Navegación, encabezado e Inicio (fase 4: Layout + Dashboard)

> **Qué cambia en producción al mergear:** la navegación inferior flotante pasa a una barra anclada de 4 destinos con rótulo
> visible (riel lateral en escritorio), el encabezado y el selector de mes cambian, y la pantalla de **Inicio** se rehace: saldo
> total en grande, **anotar rápido de un toque con Deshacer**, vencimientos y cuentas en lista. **Esa acción escribe movimientos
> reales** (un gasto de hoy) y Deshacer los anula con un movimiento compensatorio. No cambia `functions/`, `api/`,
> `firestore.rules`, `src/services/api.js`, `money.js`, `mappers.js` ni lo que devuelven los hooks.
> Es un solo PR (Layout + Dashboard) porque ambos tocan `App.jsx`; Movimientos, Reportes, Gastos fijos, Perfil y Landing/Login siguen
> con su aspecto anterior (ya legible con los tokens nuevos).

### Qué cambia
- **Layout**: barra inferior anclada (nunca tapa contenido), `aria-current`, tecla **Anotar** de acento, área segura, riel lateral
  desde 768 px, "Saltar al contenido". `AppHeader` (saludo, tema con nombre accesible, **Volver** en Gastos fijos) y `MonthSelector`
  (botones de 44 px, mes anunciado). Los avisos se ubican sobre la navegación.
- **Inicio**: saldo total con Doto + `Odometer` (escala con el ancho; mono si es larguísimo), Entró/Salió con signo y flecha,
  **Anotar rápido** (los gastos más repetidos del mes; solo en el mes actual), **Para pagar** (estado con ícono y texto, "1 día"/"2 días"),
  **Cuentas** en lista vertical con rótulo "Deuda".
- **Deshacer**: el id del documento de un gasto es el `requestId` que manda el cliente (`functions/finance/transactions.js`, ADR 001),
  así que Deshacer = `voidTransaction(requestId)`. Probado de punta a punta en el emulador: el toque baja el saldo, Deshacer lo devuelve y no
  queda fila visible. Un doble toque no carga dos veces.
- Utilidades puras con pruebas: `frequentExpenses`, `dashboardFormat`.

### Antes / después
Antes (auditoría, 375 px): `docs/ui-redesign/audit/` (`07`, `08`, `10`, `14`, `05`).
Después: `docs/ui-redesign/layout/` y `docs/ui-redesign/dashboard/` (393 px claro y oscuro, escritorio con riel, un toque con Deshacer,
caso extremo a 320 px).

### Cómo probarlo
- Preview de Vercel de la rama (comentario del bot en este PR).
- Local: `npm run emulators`, `npm run dev:api`, `node scripts/seed-emulators.js`, Vite con las variables de `CLAUDE.md`.
  En Inicio tocá un frecuente → baja el saldo y aparece el aviso con **Deshacer**.

### Verificación
`npm run lint` (0 errores), `npm test` (104 pruebas, 27 nuevas), `npm run build`. Revisado en el navegador a 393 px (iPhone 15), 320 px,
escritorio, claro y oscuro; movimiento completo verificado con Playwright (`prefers-reduced-motion: no-preference`).
**No probado en Safari ni en un iPhone real.** Contraste calculado en los tokens (ver `docs/ui-redesign/design-system.md`).

### Límites conocidos
- Los frecuentes salen de los movimientos del mes seleccionado: al empezar un mes no hay hasta cargar algo. Ampliarlo necesita un dato
  nuevo de la capa de datos (se consulta antes).
- `App.css` quedó sin uso (ya no se importa).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
