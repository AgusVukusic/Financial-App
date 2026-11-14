# Traspaso de sesión: rediseño de UI de Financial App

Documento de continuidad. Está escrito para que una sesión nueva siga el trabajo como si fuera la misma. Leelo completo antes de
tocar nada; después leé `progress.md` (registro cronológico) y `design-system.md` (reglas y componentes). Última actualización: 2026-11-14,
con `main` en `14e9add` (PR #7 mergeado, CI en verde).

---

## 0. Cómo retomar (primeros pasos, en orden)

1. Leer, en este orden: este archivo, `docs/ui-redesign/progress.md`, `docs/ui-redesign/design-system.md`, `PRODUCT.md`, `CLAUDE.md` (raíz del repo) y
   `~/.claude/CLAUDE.md` del usuario (estilo de respuesta y reglas de trabajo, resumidas en la sección 2).
2. Verificar el estado real, sin confiar en este documento:
   - `git fetch origin && git status -sb && git log --oneline origin/main -5`.
   - ¿Hay PRs abiertos o ramas `feature/ui-*` sin mergear? API pública, sin `gh` (no está instalado): ver sección 8.
   - CI de `main` (check-runs del último commit): debe estar en verde.
3. Parar en `main` actualizado (`git checkout main && git pull --ff-only`) y crear una rama nueva por pantalla (sección 9).
4. Decirle al usuario en dos líneas dónde quedó el trabajo y qué pantalla sigue (Reportes, salvo que haya cambiado el orden), y **seguir** sin esperar
   respuesta, salvo que falte un dato que solo el usuario tiene.
5. Mantener la lista de tareas del turno (`update_plan`) y cerrar cada turno con `wrap_up`, como pide el entorno de la app de escritorio.

## 1. El proyecto y el pedido original

**Financial App** ("Finanzas Personales"): PWA de finanzas personales en pesos argentinos, React 19 + Vite, Firebase Auth + Firestore, backend en Vercel
`/api` (ver `CLAUDE.md`). La usan el autor y gente cercana, sobre todo desde el celular. Producción: https://financial-app-seven-cyan.vercel.app (Vercel publica
`main` solo). Repo: `AgusVukusic/Financial-App`. UI en español rioplatense (voseo).

**Pedido del usuario** (resumen fiel del prompt inicial): auditar la UI/UX y rediseñarla por completo; "no alcanza con corregir lo que está mal: hay que
llegar a un diseño nuevo que me convenza". "Bien hecho" = identidad coherente y moderna que se sienta nativa en el celular; registrar un gasto rápido,
en pocos toques; información financiera legible de un vistazo; accesible (contraste, foco visible, objetivos de 44 px o más); claro y oscuro.

**Alcance.** Se puede cambiar todo lo visual y de interacción. **No se toca** la capa de datos ni el backend: `functions/`, `api/`, `firestore.rules`,
`src/services/api.js`, `src/utils/money.js`, `src/utils/mappers.js` ni lo que los hooks reciben y devuelven (están verificados y en producción; un cambio
ahí puede romper saldos reales). Si el rediseño necesita algo de esa capa (un dato nuevo, otro formato): **anotarlo y preguntar antes**. **Grupos** está
fuera de la Beta: no se rediseña ni se vuelve a mostrar (`Groups.jsx`, `GroupDetails.jsx`, `useGroups.js` siguen en el repo, inalcanzables).

**Fases pedidas:** 0 inventario de skills ✋, 1 auditoría ✋, 2 dirección visual ✋, 3 sistema de diseño ✋, 4 rediseño pantalla por pantalla (orden:
Layout → Dashboard → modal de transacción → TransactionList → Reportes → SubscriptionsManager → Profile → Landing/Login/Activación; "capturas antes/después
cada 2 pantallas ✋"), 5 cierre (lint, tests, build, pasada final de accesibilidad y `prefers-reduced-motion`, resumen corto). ✋ = frenar y esperar respuesta.

**Estado entre sesiones:** mantener `docs/ui-redesign/progress.md` (fase, decisiones y su porqué, pantallas terminadas, PRs, pendientes). Releerlo al retomar.

## 2. Reglas de trabajo del usuario (obligatorias)

De `~/.claude/CLAUDE.md` y del prompt inicial:

- **Respuestas en español, breves y concretas.** Sin introducciones, sin resúmenes largos, sin repetir lo que dijo. Si hay más para contar, ofrecerlo en una línea.
  El detalle va en informes, PRs y `progress.md`, no en el chat. (Esta es la razón por la que los cierres de turno son cortos pero con links.)
- **Advisor:** consultarlo antes de cerrar un plan, cuando el mismo error aparece por segunda vez y antes de dar una tarea por terminada.
- **Reparto de trabajo:** Sonnet conduce y edita; Opus solo como advisor; Haiku para lecturas mecánicas. Subagentes `search` (mapear un área), `grep` (antes de
  renombrar o borrar) y `docs` (API externa). Para búsquedas puntuales, Glob/Grep/Read directo. El usuario autorizó agentes (Sonnet, esfuerzo medio) para
  investigación y diseño cuando lo pidió; para edición de las pantallas reales, trabajar directo.
- **Decisiones sin consultar:** elegir herramienta y ruta cuando hay una opción obvia; preferir las herramientas dedicadas (Read, Grep, Glob, Edit) antes que shell;
  reintentos: máximo 2 con el mismo enfoque, al segundo fallo cambiar de enfoque y consultar al advisor.
- **Antes de cualquier acción difícil de revertir (borrar, sobrescribir, enviar, publicar): mostrar qué se va a hacer y esperar confirmación.**
  - **No borrar componentes ni archivos sin avisar qué se va y por qué** (el usuario autorizó solo los que se le pidieron explícitamente; el sistema además
    bloquea algunos `rm`/`git rm` y hay que preguntar).
  - Si una prueba, el build o el CI fallan dos veces seguidas con el mismo enfoque: frenar, explicar y proponer alternativas.
- **Git/GitHub:** `main` es producción: **nunca push directo**. Una rama por unidad de trabajo, desde `main` actualizado (`feature/ui-<pantalla>`). Commits
  chicos y convencionales (`feat(ui): …`, `fix(ui): …`, `refactor(ui): …`, `docs(ui): …`). Si una rama depende de otra sin mergear: avisar y **esperar el merge de
  la base** (no apilar PRs). Se puede hacer push de ramas `feature/ui-*`. PR hacia `main` con: qué cambia y por qué, capturas antes/después (375 px y escritorio),
  cómo probarlo y link al preview de Vercel. CI (lint, tests, build) en verde antes de pedir el merge. **El merge lo hace el usuario** (o vos solo con su OK explícito
  para ese PR). Sin `force push`, sin reescribir historia pusheada, sin borrar ramas remotas sin avisar.
- **Mensajes de commit:** terminan con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (o la atribución que indique el sistema en esa sesión). Cuerpos de PR
  terminan con `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- **Cada hallazgo de auditoría** lleva severidad, pantalla, problema, impacto, propuesta y evidencia (formato ya usado en `audit.md`).
- Después de cada pantalla: verificarla en el navegador (375 px y escritorio, claro y oscuro) y probarla con casos extremos (la skill `break-ui`: se hicieron
  casos extremos a mano y en pruebas, no se corrió la skill como tal; decirlo siempre con honestidad).
- Informar con fidelidad: si algo no se probó (Safari, iPhone real, lector de pantalla), decirlo. Nunca afirmar que algo funciona sin evidencia.

## 3. Estado actual

### Hecho y mergeado en `main`

| PR | Rama | Contenido |
|---|---|---|
| #5 | `feature/ui-design-system` | Docs de auditoría/direcciones/conceptos, tokens claro/oscuro, componentes base, página `/showcase.html` (solo dev) |
| #6 | `feature/ui-layout` | Navegación (barra inferior anclada / riel lateral ≥768 px), `AppHeader`, `MonthSelector`, **Dashboard** completo (saldo Doto + `Odometer`, Anotar rápido con Deshacer, Para pagar, Cuentas) |
| #7 | `feature/ui-transaction-sheet` | `AddTransactionModal` y `AddAccountModal` como hojas (`Sheet`), lista de Movimientos, eliminar dentro de la hoja, `parseAmountInput`, borrado de 5 CSS viejos |

`main` = `14e9add`. CI en verde (jobs "Lint, unit tests and build" y "Firestore rules and Cloud Functions (emulators)"). Verifiqué el CI de `main` por API.
Todo esto **ya está en producción**.

### Pantallas

| Pantalla | Estado |
|---|---|
| Layout / navegación / encabezado / selector de mes | ✅ rehecho |
| Dashboard (Inicio) | ✅ rehecho |
| Modal de movimiento + modal de cuenta | ✅ rehechos (hojas) |
| TransactionList (Movimientos) | ✅ rehecha |
| **Reportes** (`Reports.jsx`, `dashboard/BudgetAlerts.jsx`) | ⏳ **siguiente**. Solo lee tokens (se ve bien, pero es el diseño viejo) |
| **Gastos fijos** (`SubscriptionsManager.jsx`, 255 líneas) | ⏳ pendiente |
| **Perfil** (`Profile.jsx`) | ⏳ pendiente |
| **Landing / Login / Activación** (`LandingPage.jsx`, `WelcomeScreen.jsx`, `ActivationScreen.jsx`) | ⏳ pendiente |
| Pasada final (fase 5) | ⏳ pendiente |

Archivos que parecen **huérfanos** (verificar con grep antes de proponer borrarlos; borrar solo con OK del usuario): `src/components/profile/SubscriptionsCard.jsx`
(133 líneas, no se importa en ninguna parte) y `src/components/dashboard/ExpenseChart.jsx` (62 líneas, tampoco). También quedarán sin uso los CSS por pantalla de las
pantallas que se rehagan (`SubscriptionsManager.css`, `LandingPage.css`).

### Cobertura de la auditoría (26 hallazgos, `audit.md`)

Resueltos: 1 transferencia desborda, 2 modal de gasto lento, 3 editar/borrar de 24 px, 5 contraste claro, 6 modales sin a11y, 8 nav tapa contenido, 10 cuentas en
carrusel, 12 Gastos fijos sin "volver", 15 toasts, 18 modales translúcidos, 21 movimiento (base), 22 transferencias sin origen→destino. Parciales: 4 (objetivos de
44 px: faltan Reportes, Gastos fijos, Perfil), 9 (jerarquía del Dashboard: se mantuvo el saldo total primero, a pedido), 17 (identidad: faltan las pantallas
pendientes), 19 (escritorio: hay riel, el contenido sigue en una columna de 880 px), 20 (PWA: hay `theme-color` y `viewport-fit`, **falta ícono propio**,
`apple-touch-icon`), 24 (voseo en las pantallas pendientes), 26 (estilos inline en las pantallas pendientes). **Pendientes: 7 (login sin verificar, ver 6.4), 11
(pagar un gasto fijo pide dos diálogos), 13 (colores de Reportes ambiguos), 14 (alertas apiladas y ejes "$2000k"), 16 (mensajes de error técnicos), 23 (Perfil vacío), 25
(Landing: "Descargar App" como acción principal; título de pestaña "Dashboard" antes de iniciar sesión).**

## 4. Decisiones de diseño y por qué

**Dirección elegida: "3 · Panel de taller"** (el usuario: "me fascinó"). Estética de instrumento: teclas con relieve, rótulos de panel en mayúsculas mono, saldo en
puntos (fuente Doto), **un solo acento naranja**, tramas/dither para distinguir categorías sin color. Se llegó tras tres tandas de direcciones (A–J, `direcciones.html`) y
una investigación web con 5 agentes que produjo tres prototipos interactivos (`concepts/`: Estación, Frascos, Panel de taller). El usuario prefirió el subte (B) al
principio, pero eligió el Panel de taller al verlo funcionando.

**Reglas del sistema** (`design-system.md` las detalla; son el criterio para cada pantalla nueva):

1. **El acento (naranja) es solo "se puede tocar"**: botón principal, numerales de sección, indicador de pestaña. Nunca marca un estado.
2. **Estado = texto + ícono (+ forma)**, nunca solo color. `--in` (entró) va con signo +; `--bad` (vencido, superado, error) y `--warn` (cerca del límite) van con ícono y
   palabra. El gasto va en tinta neutra con signo −. El rojo no es para confirmaciones no destructivas.
3. **Objetivos táctiles de 44 px o más** (`--tap`); acciones principales 56 px (`--tap-lg`). Texto con contraste AA (calculado, ver `design-system.md`).
4. **Claro y oscuro valen lo mismo**; el tema sigue al sistema hasta que la persona elige (`useTheme`, clave `financial_app_theme`).
5. **Movimiento con función**: solo `transform` y `opacity`; `MotionConfig reducedMotion="user"` global; con "reducir movimiento" no hay desplazamientos.
6. **Cifras en mono tabular**; el saldo grande en Doto (48 px, escala con el ancho; mono si pasa de 12 caracteres).
7. **Registrar un gasto es la acción más frecuente**: monto primero, pocos toques, Deshacer en vez de confirmar cuando la acción es reversible.
8. **Secciones con numeral y filete** (`SectionHeader` 00, 01, 02, 03…), listas en renglones de un solo botón, estados vacíos con una acción.
9. **Copy en voseo rioplatense** ("Anotá", "Pagá", "Elegí"), títulos en minúscula salvo rótulos mono en mayúsculas, sin emoji como marca.

**Tokens** (`src/styles/tokens.css`): `--bg --surf --chip --ink --ink2 --rule --acc --onacc --in --bad --warn`, tipografías (`--font-ui` Hanken Grotesk, `--font-mono` Geist Mono,
`--font-dot` Doto), escala de tamaños, espaciado `--sp-1..7`, radios `--r-*`, movimiento `--dur-*`/`--ease-out`, capas `--z-*`, navegación `--nav-h`/`--nav-rail-w`/`--toast-bottom`.
Tema: `body.light-theme` o `data-theme="light|dark"`. **Los alias legados** (`--text-primary`, `--bg-base`, `--accent-primary`, `--spacing-*`, `--radius-*`, …) siguen
definidos al final de `tokens.css`, declarados **en cada selector de tema** (si se declaran solo en `:root` se resuelven con el valor oscuro: bug ya encontrado y corregido).
**No usarlos en código nuevo; borrarlos cuando se rehaga la última pantalla.**

## 5. Código nuevo (inventario)

- `src/components/ui/`: `Button` (variants `primary/key/outline/ghost/danger/success`, sizes, `isIcon`, `block`), `Card` (`plain/dotted/dashed`), `Chip`, `Tag`, `Meter`
  (medidor de 10 segmentos con exceso rayado), `Dither`/`DitherBar`, `Odometer`, `SectionHeader`, `Field` (etiqueta+ayuda+error conectados), `Input`, `Select`, `Sheet`
  (hoja inferior modal), `ConfirmDialog` (`alertdialog`), `ToastContext` (`showToast(msg, tipo, ms, { action })`), `useDialogA11y` (foco, Tab, Escape, scroll lock, **pila de
  diálogos**), `index.js` (barrel). Pruebas en `ui.test.jsx`.
- Shell: `Layout.jsx/.css` (CSS global con clases `layout__*`), `AppHeader`, `MonthSelector`. Pruebas en `shell.test.jsx`.
- Inicio: `Dashboard.jsx`, `dashboard/BalanceCard`, `QuickAdd`, `UpcomingSubscriptions`, `Accounts/AccountList`, `AccountCard`. Pruebas en `dashboard/dashboard.test.jsx`.
- Formularios: `AddTransactionModal` (con `TransactionForm` interno) y `Accounts/AddAccountModal` (con `AccountForm`), estilos compartidos en `FormSheet.module.css`. Se montan
  solo con la hoja abierta (el estado inicial sale de las props). Pruebas en `formSheets.test.jsx`.
- Lista: `TransactionList.jsx` + `.module.css`. Pruebas en `TransactionList.test.jsx`.
- Utilidades puras con pruebas: `utils/frequentExpenses.js` (frecuentes + `localDateString`), `utils/dashboardFormat.js` (`splitBalance`, `pluralizeDays`, `dueText`),
  `utils/amountInput.js` (`parseAmountInput`: **"1.500" = 1500, "3,5" = 3.5**; el `type="number"` leía "1.500" como 1,5).
- `contexts/DialogContext.jsx`: `confirm(mensaje, título, { confirmText, destructive })` y `alert(...)`, ambos sobre `ConfirmDialog`. **`destructive: false` da el botón primario
  (no rojo): usarlo en confirmaciones que no borran (pagar, cerrar sesión).**
- `hooks/useTheme.js` (tema del sistema por defecto, actualiza `theme-color`), `main.jsx` (`MotionConfig`), `index.html` (fuentes por `<link>`, `viewport-fit=cover`).
- Dev: `showcase.html` + `src/dev/showcase.jsx` (todos los componentes en ambos temas), `scripts/seed-emulators.js`, `.claude/launch.json` (servidores).
- Docs: `docs/ui-redesign/` (`audit.md`, `design-system.md`, `progress.md`, este archivo, `direcciones.html`, `concepts/`, capturas por pantalla, cuerpos de PR `pr-*.md`).

**Contrato verificado de Deshacer** (no se tocó la capa de datos): el id del documento de un gasto es el `requestId` que manda el cliente (`functions/finance/transactions.js`,
ADR 001); `voidTransaction(requestId)` lo anula con un movimiento compensatorio que los mappers ocultan. `addTransaction` acepta `data.requestId` y no devuelve nada.

## 6. Lo que falta, pantalla por pantalla

Para cada una: rama nueva desde `main`, rehacer, pruebas, verificar (sección 10), commits, push, cuerpo de PR en `docs/ui-redesign/pr-<pantalla>.md`, ✋ cada 2 pantallas.
Antes de cada pantalla leer su código completo y su CSS. Convertir `style={{…}}` y CSS por pantalla a tokens + CSS Modules + componentes de `ui/`.

### 6.1 Reportes (`Reports.jsx`, 196 líneas; `dashboard/BudgetAlerts.jsx`, 47)
- Hoy: tres alertas apiladas arriba, gráfico de barras de 6 meses (recharts, ejes "$2000k"), torta de distribución sin etiquetas, presupuestos por categoría con barra y edición
  inline (engranaje de ~16 px), colores de categoría distintos entre punto y barra (hallazgo 13). Usa `useAllTransactions(uid)` y `updateBudget(category, amount)` (`setBudget`,
  montos en pesos; tope por categoría).
- Hacia dónde: **Meter** de 10 segmentos por categoría (ya existe) con estado en texto ("Superado por $ 87.499" con ícono, "Cerca del límite · 93%", "Quedan $ 41.419", "Sin tope");
  gráfico de gasto por categoría con **DitherBar** + leyenda en texto con porcentajes (no depender del color); evolución de 6 meses con ejes legibles ("$ 2 M"), colores
  por tokens (`--in` / tinta, no rojo para el gasto) y `role="img"` + tabla alternativa o resumen en texto; las alertas se resumen en una línea con acción; el tope se edita en
  una `Sheet` o campo con 44 px usando `parseAmountInput` (no `type="number"`); "termómetro de ritmo" (gastado vs esperado a la fecha) es una idea de la investigación que cabe acá.
  Tooltips de recharts ya usan tokens (se parchearon). Casos extremos: sin presupuestos, sin movimientos, un solo mes, montos enormes, categoría sin tope.
- Cuidado: no cambiar cómo se calcula nada (`utils/calculations.js` tiene pruebas).

### 6.2 Gastos fijos (`SubscriptionsManager.jsx`, 255 líneas + `SubscriptionsManager.css`)
- Hoy: tarjetas con borde lateral de color (patrón que el detector de impeccable marca), botón "Pagar" que abre un diálogo de confirmación y luego un **segundo diálogo "Aviso /
  Entendido"** (hallazgo 11), formulario de alta/edición inline, estados "Vencido hace N días" con pluralización mala ("1 días").
- Hacia dónde: ordenar por vencimiento con estado en texto+ícono (usar `dueText` de `utils/dashboardFormat.js`); **Pagar con `confirm(..., { destructive: false, confirmText: 'Pagar' })`**
  y resultado como toast (sin el segundo diálogo), idealmente con **Deshacer**: `paySubscription(id, requestId)` crea el gasto con ese `requestId`, y `voidTransaction` de un pago
  de gasto fijo debería revertir `lastPaidAt` (`readVoidPlan` en `functions/finance/transactions.js` trae `subRef`/`sub`). **Verificar leyendo `functions/finance/subscriptions.js` y
  `transactions.js` y probar en el emulador antes de ofrecer Deshacer**; si no se sostiene, es una necesidad de la capa de datos: parar y preguntar.
  Alta/edición en una `Sheet` (monto con `parseAmountInput`, día de vencimiento, ciclo mensual/anual, categoría, cuenta obligatoria); eliminar con confirmación `destructive` (rojo OK).
  Sin tarjetas con borde lateral. Pagados distinguibles (Card `dashed` + Tag "Listo"). Mantener "Volver" (ya está en `AppHeader`).

### 6.3 Perfil (`Profile.jsx`, 67 líneas)
- Hoy: avatar, "Plan Cloud Activo" (no significa nada, hallazgo 23), botones PDF/CSV sin explicar, "Cerrar sesión" con confirm. Usa `useAllTransactions` y `exportToPDF/exportToCSV`.
- Hacia dónde: mostrar nombre y **email** (App tiene `user.email`; pasarlo como prop), exportar rotulado ("Exportar movimientos · PDF/CSV", con qué período), tema (el toggle ya está en
  el encabezado; opcional agregar "Tema: sistema/claro/oscuro" si se quiere), cerrar sesión con `confirm(..., { destructive: false, confirmText: 'Cerrar sesión' })`, versión/estado de la
  Beta, enlace a ayuda. Objetivos de 44 px. Estado de carga/error de la exportación visible.

### 6.4 Landing / Login / Activación (`LandingPage.jsx`+`.css`, `WelcomeScreen.jsx` 205 líneas con ~21 estilos inline, `ActivationScreen.jsx` 91 líneas)
- **Pruebas existentes que deben seguir pasando:** `ActivationScreen.test.jsx`.
- **Hallazgo 7 (bug real, Alta):** el invitado se registra, verifica el email y vuelve a "Ingresar", pero el aviso "Tu correo electrónico no está verificado" no se va y el login no
  entra hasta recargar. **Hipótesis a confirmar:** `signInWithEmailAndPassword` devuelve un `user` con `emailVerified` en caché; hay que hacer `await user.reload()` (o leer
  `auth.currentUser` después de `reload()`) antes de chequear `emailVerified`; además el toast de error está en `duration 0` y no se cierra. Reproducir en el emulador (verificar con
  `http://127.0.0.1:9099/emulator/v1/projects/financial-app-beta/oobCodes` o marcando `emailVerified` por la API de Auth del emulador), arreglar en `WelcomeScreen.jsx`/`App.jsx`
  (no es capa de datos) y cubrir con una prueba (mockear `firebase/auth`).
- Hallazgo 16: los errores muestran `err.message` crudo ("Firebase: Error (auth/network-request-failed)"). Mapear códigos a mensajes humanos con acción ("Sin conexión. Probá de nuevo").
- Hallazgo 25: la Landing tiene "Descargar App" como botón principal aunque la acción real es entrar; el título de la pestaña dice "Dashboard" antes de iniciar sesión (`App.jsx` `document.title`).
  Usar `usePWA` (instalación) como acción secundaria. Landing = modo Persuade (pero es una app privada con invitación: simple, sin marketing inflado). Revisar el modal de instrucciones de iOS
  (div con `onClick`, sin rol, hallazgo de a11y): pasarlo a `Sheet`.
- Formularios con `Field`/`Input` (16 px, sin zoom en iOS), contraseña con mostrar/ocultar, `autocomplete` correcto (`email`, `current-password`/`new-password`), botón de reenviar verificación visible y claro,
  estado de "te enviamos un correo" con instrucciones. `ErrorBoundary.jsx` (42 líneas, estilos inline) también entra acá (tiene prueba `ErrorBoundary.test.jsx`).
- Activación (`ActivationScreen`): estados "activando", "no estás en la lista de invitados" (con el email y "Cerrar sesión") y error de conexión con "Reintentar". Es una pantalla de uso único: clara y breve.

### 6.5 Fase 5: cierre
- `npm run lint`, `npm test`, `npm run build` y CI en verde en el último PR.
- **Pasada final de accesibilidad:** foco visible en todo, orden de tabulación, `aria-*` en controles propios, objetivos de 44 px (auditar con un script como el de la sesión: `getBoundingClientRect` de
  `button,input,select,a`), contraste (script con los tokens), lector de pantalla (no se probó nunca: decirlo), zoom de texto al 200 %.
- **`prefers-reduced-motion`:** probar la ruta de movimiento completo con Playwright (`browser_emulate_media reducedMotion: no-preference`) porque el panel integrado emula "reducir movimiento".
- **break-ui:** correr la skill de verdad en alguna pantalla densa (Reportes) o declarar que se hicieron casos extremos a mano.
- Quitar los alias legados de `tokens.css`, los CSS sin uso y los `style={{…}}` restantes (`grep -rn "style={{" src`).
- Ícono de la PWA propio (hoy `vite.config.js` apunta a una URL externa de flaticon), `apple-touch-icon`, `apple-mobile-web-app-*`; fuentes de Google sin caché offline (la PWA no las precachea).
- `DESIGN.md` con `/impeccable document` (impeccable lo lee al iniciar sesión y hoy dice "no hay DESIGN.md"; se evitó a propósito durante el trabajo). Actualizar `CLAUDE.md` (sección de UI) y `progress.md`.
- Resumen final corto al usuario.

## 7. Deuda y decisiones abiertas

- **Frecuentes limitados al mes seleccionado** (el hook solo trae ese mes): al empezar un mes no hay frecuentes. Ampliarlo necesita un dato nuevo (p. ej. un hook o consulta de los últimos 90 días):
  **preguntar al usuario antes** (es capa de datos).
- Desktop: el contenido sigue en una columna de 880 px; la `Sheet` se centra en la ventana, no en la columna del contenido (como el toast, que ya se corrigió). Una grilla de dos columnas en ≥1024 px
  queda como mejora opcional.
- Entrada de texto natural ("café 3500") del concepto 3: **no implementada**; `CK.parse` del prototipo (`docs/ui-redesign/concepts/common.js`) es la referencia. Proponerla al usuario como mejora de Anotar.
- `SubscriptionsCard` y `ExpenseChart` huérfanos (ver sección 3).
- Hallazgo 24 (voseo): hay textos viejos en las pantallas pendientes ("Registra", "Debes").
- Las confirmaciones de `DialogContext` usan botón rojo por defecto; las no destructivas deben pasar `destructive: false` (pendiente en Gastos fijos y Perfil).
- `.impeccable/config.json` guarda ignores del detector de diseño (3 entradas, con motivo); `.claude/` y `.impeccable/` están **sin commitear a propósito** (skills instaladas y config local).

## 8. Entorno y trampas conocidas (leer: ahorra horas)

**Máquina:** Windows 11, shell principal PowerShell, Bash (Git Bash) disponible. Carpeta del proyecto: `C:\Users\Agustín\OneDrive\Documentos\Programacion\Financial App`. Node 22, Java 21.
**No hay `gh`.** Todo lo de GitHub va por `git` y la API pública con `curl`:
- PRs: `https://api.github.com/repos/AgusVukusic/Financial-App/pulls?state=all&head=AgusVukusic:<rama>` · CI de un commit: `…/commits/<sha>/check-runs`.
- Preview de Vercel: `…/deployments?sha=<sha>` y luego `…/deployments/<id>/statuses` (`environment_url`). Esperar ~50 s tras el push.
- El usuario abre el PR desde `https://github.com/AgusVukusic/Financial-App/compare/main...<rama>?expand=1` y pega el cuerpo de `docs/ui-redesign/pr-<pantalla>.md`.
- El **push falló una vez con 403** (credenciales de otra cuenta) y al reintentar funcionó. Si falla, decirlo y pedir al usuario que haga el push o arregle la credencial; no probar otras.
- `test.yml` corre en push/PR a `main`, no en pushes de ramas: el CI de la rama aparece al abrir el PR.

**Servidores locales** (`.claude/launch.json`, arrancar con `preview_start` por nombre): `emulators` (Auth 9099, Firestore 8080), `dev-api` (5002), `vite` (5173). Los emuladores **no persisten**: al
reiniciarlos correr `node scripts/seed-emulators.js` (crea `ana@prueba.test` / `Prueba-1234`, **solo emulador**, la invita, y carga 4 cuentas, ~24 movimientos de noviembre 2026 con ruido,
presupuestos y 5 gastos fijos; vaciar antes con `curl -X DELETE http://127.0.0.1:8080/emulator/v1/projects/financial-app-beta/databases/(default)/documents` si se repite). `.env.development.local`
(ignorado por git) apunta el frontend a los emuladores con `VITE_API_TRANSPORT=http`. Tema por `localStorage.financial_app_theme` (`light`/`dark`) o clase `light-theme` en `body`.

**Navegador integrado (panel):**
- Está **hecho para emular "reducir movimiento"** (`prefers-reduced-motion: reduce` da `true`) y **estrangula `requestAnimationFrame` cuando el panel está oculto** (3 fps): las capturas salen a
  mitad de animación o diminutas (8×6 px). Solución: `mcp__ccd_view__show_pane` con `preview` (y cerrar el panel de artifacts si está abierto). Para movimiento completo usar Playwright
  (`mcp__playwright__*`, cargar con ToolSearch) con `browser_emulate_media {reducedMotion:'no-preference'}`.
- `resize_window` con ancho/alto fijos emula el dispositivo; se **borra solo** cuando cambia el ancho del panel (volver a fijarlo). iPhone 15 = 393×852. UA es Chrome Android: **no es Safari**.
- Navegar a `file://` abre una pestaña nueva con otro `tabId`: volver a pedir `tabs_context`. El login tarda unos segundos tras recargar.
- Para clicks confiables usar `find`/`ref` o JS (`element.click()` tras `focus()`); para tipear con teclado real, `computer {action:'type'}` y `key`.
- Las capturas quedan en `~/.claude/projects/<proyecto>/<sesión>/tool-results/…jpg` y hay que copiarlas a `docs/ui-redesign/<pantalla>/`.

**Edición de archivos:**
- La herramienta `Edit` falla con cadenas que contienen espacios duros (NBSP, `\u00a0`) o con saltos de línea CRLF distintos. **Para parches multilínea o con `$`, escribir un `.mjs` en el
  directorio temporal de la sesión y ejecutarlo con `node`** (así se hizo siempre); evitar `node -e "…"` inline con `$`/comillas en Bash, y recordar que `String.replace` interpreta `$&`/`$$`
  en el reemplazo (usar función o evitar `$`). Los archivos del repo tienen CRLF en el árbol de trabajo (avisos "LF will be replaced by CRLF": inofensivos).
- ESLint ignora `docs/` y `.claude`; el CI corre lint sobre `src`, `functions`, `test`, `scripts`. Los componentes que importan `src/services/api.js` inicializan Firebase al importarse y **rompen
  las pruebas en CI** (no hay variables): en pruebas usar `vi.mock('…/services/api', () => ({ newRequestId: () => crypto.randomUUID() }))` como en `dashboard.test.jsx` y `formSheets.test.jsx`.
- Algunos comandos con `rm`/`git rm` los bloquea el clasificador de seguridad; si pasa, no esquivar: preguntar al usuario.

**Skills disponibles:** `impeccable` (con `context`, detector y hooks: tras cada edición de UI un hook corre el detector de diseño; falsos positivos conocidos se ignoran con
`impeccable hooks ignore-value <regla> "*" --file <ruta> --reason "…"` y se declaran al usuario), `mobile-native`, `break-ui`, `animate`, `animation-performance`, `dataviz`, `artifact-design`, y las
`agent-skills:*`. **No están instaladas** `emil-design-eng`, `review-animations`, `apple-design`. El flujo de impeccable de "decision page" (`serve-question`) se sustituyó por páginas de comparación
(artifacts) en las fases 2 y 3. `PRODUCT.md` ya existe en la raíz (hecho a partir del repo y de las respuestas del usuario; algunos datos están marcados como inferidos).

## 9. Protocolo de git por pantalla

1. `git checkout main && git pull --ff-only origin main && git checkout -b feature/ui-<pantalla>` (si hay un PR abierto del que dependés: avisar y esperar el merge).
2. Trabajar, commitear en pasos chicos (convencionales, con la línea `Co-Authored-By`).
3. `npm run lint && npm test && npm run build` antes del push (los tres deben pasar; hoy lint tiene 0 errores y unos 9 avisos conocidos de reglas del compilador de React).
4. `git push -u origin feature/ui-<pantalla>`.
5. Escribir `docs/ui-redesign/pr-<pantalla>.md` (qué cambia **en producción** al mergear, antes/después con rutas de capturas, cómo probarlo, verificación honesta, límites) y actualizar `progress.md`.
6. Obtener el preview de Vercel por API y entregar al usuario: link de comparar, link de preview y el cuerpo del PR. Cuando el usuario lo abra, mirar el CI una vez (no hacer polling).
7. Esperar el merge; no seguir encadenando ramas sobre la anterior.

## 10. Protocolo de verificación por pantalla (lo que se hizo y debe repetirse)

- Navegador integrado a **393 px y 320 px** y escritorio (~1100 px), **claro y oscuro**: sin scroll horizontal (`scrollWidth === innerWidth`), nada cubierto por la navegación, objetivos de 44 px
  (script con `getBoundingClientRect`), foco visible, Escape y Tab en hojas/diálogos.
- Casos extremos: nombres y descripciones larguísimos, cifras enormes, listas largas y vacías, mes fuera del actual, sin cuentas, errores del servidor.
- Flujo real contra el emulador: ejecutar la acción, comprobar el saldo antes/después y que la lista cambie; si hay Deshacer/eliminar, comprobar que no queda rastro visible.
- Contraste de cualquier color nuevo por cálculo (fórmula WCAG; los tokens ya cumplen).
- Movimiento completo con Playwright si la pantalla anima algo.
- Capturas a `docs/ui-redesign/<pantalla>/` y mencionar en el PR qué **no** se probó (Safari, iPhone real, lector de pantalla).

## 11. Lo que el usuario ya decidió o pidió (para no volver a preguntar)

- Dirección: Panel de taller (aprobada). Claro y oscuro con igual importancia. El saldo total va primero.
- "Dejemos de inventar la rueda": investigar apps reales (incluidas las arriesgadas) y construir sobre eso (hecho).
- Autorizó borrar `Toast.css`, `ConfirmDialog.css`, `App.css`, `AddTransactionModal.css` y `TransactionList.css`. **No autorizó** ningún otro borrado.
- Aprobó mergear los PRs #5, #6 y #7 (los mergeó él).
- Pidió probar en formato iPhone (no tamaño máximo) cuando fue posible.
- Quiere respuestas breves; los cierres de turno traen: qué cambió, cómo verificaste, qué no se probó y **una sola pregunta** con botones.

## 12. Preguntas abiertas para el usuario

1. ¿Ampliar los frecuentes a los últimos meses? (requiere dato nuevo de la capa de datos).
2. ¿Entrada por texto natural ("café 3500") en Anotar? (idea del concepto 3, no construida).
3. ¿Grilla de dos columnas en escritorio (≥1024 px)?
4. ¿Borrar `profile/SubscriptionsCard.jsx` y `dashboard/ExpenseChart.jsx` (huérfanos)? Verificar y pedir OK.
5. ¿Ícono propio para la PWA? Necesita un asset del usuario o autorización para proponer uno.
