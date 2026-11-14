## Sistema de diseño "Panel de taller" (fase 3 del rediseño)

> **Ojo: al mergear, toda la app en producción cambia de aspecto ya**, antes de rehacer las pantallas. Los tokens nuevos
> reemplazan a los viejos (con alias para que las pantallas actuales sigan leyéndose), los botones, tarjetas, campos,
> avisos y diálogos tienen el estilo nuevo, y la tipografía pasa a Hanken Grotesk + Geist Mono. La estructura de las
> pantallas no cambia; eso viene en las fases siguientes. No toca `functions/`, `api/`, `firestore.rules`,
> `src/services/api.js`, `money.js`, `mappers.js` ni lo que devuelven los hooks de datos.

### Qué cambia y por qué
- **Tokens claro/oscuro** (`src/styles/tokens.css`): color, tipografía, espaciado, radios, movimiento, capas. Un solo acento
  (naranja) para lo tocable; entró/alerta/aviso solo como estado, siempre con ícono o texto. Contraste AA calculado.
- **Base global**: sin vidrio ni brillos, fuentes por `<link>`, `theme-color`, `viewport-fit=cover`, tema que sigue al sistema
  hasta que la persona elige, `MotionConfig reducedMotion="user"`.
- **Componentes base** (`src/components/ui/`): Button, Card, Input, Select, Toast y ConfirmDialog rehechos (44 px o más, foco
  visible, relieve de tecla). Nuevos: Sheet (hoja inferior modal), Chip, Tag, Meter, Dither/DitherBar, Odometer,
  SectionHeader, Field y `useDialogA11y` (foco atrapado, Escape, bloqueo de scroll).
- **Pantallas viejas**: parches mínimos para que se lean en claro y oscuro (los alias se resolvían siempre con el valor oscuro;
  tooltips y botones con blanco fijo). No se rediseñó ninguna.
- **Auditoría y decisiones** en `docs/ui-redesign/` (informe de 26 hallazgos, direcciones, conceptos, guía del sistema).

### Antes / después (375 px)
Antes (auditoría): `docs/ui-redesign/audit/` (`07-dashboard-oscuro`, `10-dashboard-lista-claro`, `12-reportes-presupuestos`,
`14-gastos-fijos`, `06-modal-gasto-oscuro`).
Después: `docs/ui-redesign/system/10..15-app-375-*.jpg` (inicio claro y oscuro, reportes, modal, gastos fijos).
Página de muestra, dos temas lado a lado: `docs/ui-redesign/system/01..05-*.jpg`.

### Cómo probarlo
- `npm run dev` → `http://localhost:5173/showcase.html` (**no está en el build ni en el preview de Vercel**: es solo desarrollo).
- Para la app con datos: `npm run emulators`, `npm run dev:api`, `node scripts/seed-emulators.js` y Vite con las variables de
  `CLAUDE.md` ("Local end-to-end run").
- Tema claro/oscuro con el botón del encabezado; con "reducir movimiento" del sistema, hojas y avisos cambian sin desplazamiento.

### Verificación
`npm run lint` (0 errores), `npm test` (68 pruebas, incluye 17 nuevas de los componentes), `npm run build`. Revisado en el
navegador a 375 px en claro y oscuro. **No probado en un celular real.**

### Pendiente (fases siguientes)
Layout/navegación, Dashboard, modal de transacción en `Sheet`, listas, Reportes, Gastos fijos, Perfil, Landing/Login.
`DialogContext.confirm` usa el botón rojo (`danger`) para toda confirmación: para las no destructivas (pagar un gasto fijo) hay
que pasarlas a `primary` al rehacer esa pantalla.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
