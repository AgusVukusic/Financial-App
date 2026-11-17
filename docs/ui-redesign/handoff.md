# Traspaso de sesión: rediseño de UI de Financial App

Documento de continuidad. Está escrito para que una sesión nueva siga el trabajo como si fuera la misma. Leelo completo antes de
tocar nada; después leé `progress.md` (registro cronológico), `design-system.md` (reglas y componentes) y `DESIGN.md` (raíz: el sistema visual en formato
legible por herramientas). Última actualización: 2026-11-15, con las cuatro unidades de la fase 5 hechas (PRs #13 a #15 mergeados; la D, `docs/ui-closing`, en su PR).
**El rediseño está terminado: todas las pantallas están rehechas, accesibles y en producción.** Lo que queda son decisiones abiertas del usuario (sección 12) y
las pruebas en aparatos reales (sección 7). Las secciones 0 y 6 describen cómo se llegó hasta acá; ya no son pasos pendientes.

---

## 0. Cómo retomar (primeros pasos, en orden)

1. Leer, en este orden: este archivo, `docs/ui-redesign/progress.md`, `docs/ui-redesign/design-system.md`, `PRODUCT.md`, `CLAUDE.md` (raíz del repo) y
   `~/.claude/CLAUDE.md` del usuario (estilo de respuesta, reparto de trabajo entre modelos y reglas, resumidas en la sección 2). Después hojear las secciones
   "No probado / límites" de `pr-reports.md`, `pr-subscriptions.md`, `pr-profile.md` y `pr-auth.md`: son la deuda de verificación de la fase 5.
2. Verificar el estado real, sin confiar en este documento:
   - `git fetch origin && git status -sb && git log --oneline origin/main -8`.
   - ¿Hay PRs abiertos o ramas `feature/ui-*` sin mergear? API pública, sin `gh` (no está instalado): ver sección 8.
   - CI de `main` (check-runs del último commit): debe estar en verde.
   - **Este archivo puede estar modificado sin commitear en el árbol de trabajo** (se actualizó localmente el 2026-11-15 sobre `main`): no descartarlo;
     commitearlo en la primera rama de la fase 5 (`docs(ui): …`).
3. Pararse en `main` actualizado (`git pull --ff-only`; los cambios locales de este archivo no chocan) y crear una rama nueva por unidad (sección 9).
4. Decirle al usuario en dos líneas dónde quedó el trabajo y por dónde se arranca, y **preguntarle de entrada las decisiones 1 y 2 de la sección 12**
   (borrados e ícono de la PWA), que traban parte de la fase 5. Mientras responde, avanzar con lo que no depende de eso.
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
- **Mensajes de commit y PR: sin atribución.** Desde el 2026-11-16 la regla del usuario (`~/.claude/CLAUDE.md`) prohíbe `Co-Authored-By`, "Generated with Claude Code" y enlaces de sesión en commits y cuerpos de PR
  (los commits viejos no se reescriben). No cambiar `user.name`/`user.email` de git.
- **Cada hallazgo de auditoría** lleva severidad, pantalla, problema, impacto, propuesta y evidencia (formato ya usado en `audit.md`).
- Después de cada pantalla: verificarla en el navegador (375 px y escritorio, claro y oscuro) y probarla con casos extremos (la skill `break-ui`: se hicieron
  casos extremos a mano y en pruebas, no se corrió la skill como tal; decirlo siempre con honestidad).
- Informar con fidelidad: si algo no se probó (Safari, iPhone real, lector de pantalla), decirlo. Nunca afirmar que algo funciona sin evidencia.

## 3. Estado actual

### Hecho y mergeado en `main` (todo en producción)

| PR | Rama | Contenido |
|---|---|---|
| #5 | `feature/ui-design-system` | Docs de auditoría/direcciones/conceptos, tokens claro/oscuro, componentes base, página `/showcase.html` (solo dev) |
| #6 | `feature/ui-layout` | Navegación (barra inferior anclada / riel lateral ≥768 px), `AppHeader`, `MonthSelector`, **Dashboard** completo (saldo Doto + `Odometer`, Anotar rápido con Deshacer, Para pagar, Cuentas) |
| #7 | `feature/ui-transaction-sheet` | `AddTransactionModal` y `AddAccountModal` como hojas (`Sheet`), lista de Movimientos, eliminar dentro de la hoja, `parseAmountInput`, borrado de 5 CSS viejos |
| #8 | `docs/ui-handoff` | Primera versión de este traspaso |
| #9 | `feature/ui-reports` | **Reportes**: alertas en una línea, "Topes del mes" (renglón-botón + `Meter` + estado en texto), tope en `Sheet`, "En qué se fue" (`DitherBar` + leyenda con %), "Últimos 6 meses" en CSS propio con tabla. Sin recharts |
| #10 | `feature/ui-subscriptions` | **Gastos fijos**: pagar con una confirmación no destructiva + toast con Deshacer, lista por vencimiento, alta/edición en `Sheet`, eliminar con confirmación |
| #11 | `feature/ui-profile` | **Perfil**: cuenta con email, exportaciones rotuladas, cierre de sesión no destructivo. Exportaciones PDF/CSV corregidas en `utils/formatters.js` |
| #12 | `feature/ui-auth` | **Landing / ingreso / registro / activación / ErrorBoundary / carga**: base `auth/AuthShell`, arreglo del login tras verificar el correo, errores de Firebase en texto humano, guía de instalación por dispositivo, título de pestaña |

`main` = `38c7f0d`. Al cerrar la sesión: lint 0 errores (9 avisos conocidos), 328 pruebas, build OK en local sobre `feature/ui-auth`.

### Pantallas

Todas rehechas: Layout/navegación, Dashboard, hojas de movimiento y cuenta, Movimientos, Reportes, Gastos fijos, Perfil, Landing/Login/Activación.
**Lo único pendiente es la fase 5 (sección 6).** El detalle de cada pantalla (qué cambió, cómo se verificó, qué no se probó) está en `pr-<pantalla>.md` y en `progress.md`.

Cosas de las pantallas nuevas que conviene saber:

- **Reportes.** El gráfico viejo sumaba las transferencias como gasto; ahora cada mes sale de `calculateTotalsAndCategories` (cambio de número hecho a propósito,
  con prueba). `setBudget` acepta 0 como "sin tope" ("Quitar tope"). Las categorías fuera de las 6 fijas se suman a "Otros" solo en la distribución.
- **Gastos fijos.** Deshacer un pago = `deleteTransaction(requestId)` con el mismo `requestId` del pago; el servidor restaura saldo y `lastPaidAt` (verificado en el
  emulador leyendo Firestore). "Pagado este mes" se afirma solo si `lastPaidDate` cae en el mes en curso: el estado `paid` de `getSubscriptionStatus` significa
  "faltan más de 5 días", no "pagado". Heredado y no tocado: los gastos anuales calculan el vencimiento como mensuales (`subscriptionUtils`).
- **Perfil / exportaciones.** `typeLabel` (Ingreso/Gasto/Transferencia) y `buildCSV` (Blob, comillas escapadas, BOM, guarda de fórmulas). Separador coma y punto decimal, como antes.
- **Login (hallazgo 7).** La causa no era `user.reload()`: con el correo sin verificar la sesión de Firebase quedaba abierta y el segundo ingreso (mismo uid) no
  disparaba `onAuthStateChanged`. Arreglo solo en `WelcomeScreen.jsx`: se cierra esa sesión; "Reenviar correo" reingresa con lo del formulario. `useUser` no se tocó.
- **Landing.** Por decisión del usuario, "Instalar la app" es la acción principal e "Ingresar" la secundaria (en modo instalado solo se ve "Ingresar"). Si el navegador
  ofrece el aviso nativo se usa ese; si no, `auth/InstallGuide` muestra los pasos del dispositivo detectado (`utils/installGuide.js`, 9 plataformas, textos sin jerga).
  `APP_NAME = 'Finanzas'` está repetido a mano ahí (es el `short_name` del manifest).

### Archivos sin uso (borrar solo con OK del usuario; verificar con grep antes)

`src/components/SubscriptionsManager.css`, `src/components/LandingPage.css`, `src/components/profile/SubscriptionsCard.jsx`, `src/components/dashboard/ExpenseChart.jsx`,
las reglas `.budget-alert` de `src/index.css`, la dependencia `recharts` (solo la importa `ExpenseChart`). A revisar: `Dashboard.css`, las clases globales viejas de
`index.css` (`glass-panel`, `btn-primary`, `btn-secondary`, `text-gradient`, `text-secondary`) y las capturas `docs/ui-redesign/auth/01-landing-claro-393.jpg` y
`06-instalar-oscuro-320.jpg` (Landing anterior, ya no referenciadas). El detector de impeccable marca 3 "side-tab" en `SubscriptionsManager.css`: son reales, del CSS
viejo huérfano, y se resuelven borrando el archivo.

### Cobertura de la auditoría (26 hallazgos, `audit.md`)

Resueltos: 1, 2, 3, 5, 6, 7 (login tras verificar), 8, 10, 11 (pagar en un paso), 12, 13 (colores de Reportes), 14 (alertas y ejes), 15, 16 (errores en texto humano),
18, 21 (base), 22, 23 (Perfil), 24 (voseo), 25 (título de pestaña; la acción principal de la Landing volvió a ser instalar **por decisión del usuario**).
Parciales: 4 (objetivos de 44 px: medidos pantalla por pantalla, falta la pasada global de la fase 5), 9 (se mantuvo el saldo total primero, a pedido), 17 (identidad:
falta ícono propio), 19 (escritorio: riel + columna de 880 px), 20 (PWA: falta ícono propio, `apple-touch-icon`, fuentes offline), 26 (quedan `style={{…}}` fuera de
las pantallas rehechas: comprobar con grep).

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

**Agregado en las pantallas de noviembre (PRs #9 a #12):**
- Reportes: `Reports.jsx` (orquestador) + `components/reports/` (`BudgetRow`, `BudgetSheet`, `BudgetsSection`, `DistributionSection`, `MonthlyChart`, `PaceCard`, `Swatch`),
  `dashboard/BudgetAlerts.jsx` reescrito, `utils/reportsData.js` (`budgetStatus`, `alertSummary`, `distribution`, `monthlySeries`, `formatCompact`, `niceMax`, `paceStatus`).
- Gastos fijos: `SubscriptionsManager.jsx` + `components/subscriptions/` (`SubscriptionRow`, `SubscriptionSheet`).
- Perfil: `Profile.jsx` + `Profile.module.css`; `utils/formatters.js` (`typeLabel`, `buildCSV`, `exportToCSV`/`exportToPDF` devuelven el nombre del archivo).
- Previo al ingreso: `components/auth/` (`AuthShell`, `auth.module.css`, `InstallGuide`), `LandingPage.jsx`, `WelcomeScreen.jsx`, `ActivationScreen.jsx`,
  `ErrorBoundary.jsx`, `utils/authErrors.js` (`authErrorMessage`), `utils/installGuide.js` (`detectInstallPlatform`, `INSTALL_GUIDES`).
- `App.jsx`: pasa `monthLabel` a Reportes, `onDeleteTransaction`/`onAddAccountClick` a Gastos fijos, `email` a Perfil; título de pestaña "Finanzas Personales"
  (sin sesión) o "<Sección> · Finanzas Personales".
- Pruebas por pantalla: `reports/reports.test.jsx`, `subscriptions/subscriptions.test.jsx`, `profile/profile.test.jsx`, `auth/auth.test.jsx`, más las de cada utilidad.

## 6. Fase 5 (cierre): HECHA

Histórico del plan, ya cumplido: A limpieza (#13), B accesibilidad y movimiento (#14), C PWA (#15), D documentación (`docs/ui-closing`). Lo que
quedó sin poder verificarse (aparatos reales, lector de pantalla) está en la sección 7 y en los `pr-*.md`.

Las pantallas están todas hechas. La fase 5 se agrupaba en pocas unidades, cada una en su rama y su PR, sin apilar (esperar el merge de una antes de la siguiente).
Orden sugerido:

### 6.1 Limpieza (`feature/ui-cleanup`) — depende de la decisión 1 de la sección 12
- Borrar lo autorizado y nada más (lista en la sección 3).
- Quitar los alias legados del final de `src/styles/tokens.css`. Antes, buscar con grep cada alias en `src/`, incluidos los archivos de Grupos (que no se tocan):
  si Grupos todavía usa alguno, ese alias queda y se anota.
- Quitar los `style={{…}}` que queden fuera de Grupos (`grep -rn "style={{" src`).
- Si se va `recharts` hay que tocar `package.json` y el lockfile: mostrar el cambio antes y correr build y pruebas después.

### 6.2 Accesibilidad y movimiento (`feature/ui-a11y`)
- Script de objetivos de 44 px y de scroll horizontal en **todas** las pantallas, a 320, 393 y ~1100 px, en claro y oscuro. En las sesiones anteriores no se
  cruzaron todas las combinaciones de tema y ancho.
- Contraste por cálculo de cualquier color que no sea un token ya medido. Foco visible y orden de tabulación en cada pantalla, hoja y diálogo; Escape con diálogos apilados.
- Zoom de texto al 200 %.
- Ruta de movimiento completo con Playwright (`browser_emulate_media {reducedMotion:'no-preference'}`). Las pantallas previas al ingreso quedaron sin animación de
  entrada: decidir si alguna la necesita.
- Correr la skill `break-ui` de verdad en una pantalla densa (Reportes o Gastos fijos). **Nunca se corrió**: los casos extremos fueron a mano y en pruebas.
- Deuda de verificación anotada en los `pr-*.md`: "Reenviar correo" y el error de sin conexión en el navegador; "Crear una cuenta" desde la hoja de Gastos fijos
  con un usuario sin cuentas; el toast que tapa "Guardar tope" si se reabre la hoja enseguida; el PDF exportado, mirándolo renderizado; escritorio en las pantallas
  previas al ingreso; ErrorBoundary en el navegador.
- Lo que no se puede verificar desde acá se declara y se le pide al usuario: Safari, iPhone real, lector de pantalla, abrir el CSV en Excel, y **seguir la guía de
  instalación en un iPhone y un Android reales** (los nombres de las opciones de cada navegador se escribieron de memoria y cambian entre versiones).

### 6.3 PWA (`feature/ui-pwa`) — depende de la decisión 2 de la sección 12
- Ícono propio (hoy `vite.config.js` apunta a una URL externa de flaticon), `apple-touch-icon`, metas `apple-mobile-web-app-*`.
- Cache offline de las fuentes de Google (la PWA no las precachea).
- `vite.config.js` no es capa de datos, pero cambia el manifest de producción: mostrar el cambio antes. Si cambia el `short_name`, actualizar `APP_NAME` en
  `src/utils/installGuide.js`.

### 6.4 Documentación (`docs/ui-closing`)
- `DESIGN.md` con `/impeccable document` (se evitó a propósito durante el trabajo).
- Actualizar la sección de UI de `CLAUDE.md` (título de pestaña, carpetas `reports/`, `subscriptions/`, `auth/`, utilidades nuevas; el lint tiene 9 avisos, no 12).
- Dejar al día este archivo y `progress.md`.
- Resumen final corto al usuario: qué quedó hecho, qué quedó sin probar en dispositivos reales y qué decisiones de la sección 12 siguen abiertas.

Paradas ✋ en la fase 5: antes de cualquier borrado, antes de tocar `package.json` o `vite.config.js`, y al terminar cada unidad.

## 7. Deuda y límites conocidos

- **Frecuentes limitados al mes seleccionado** (el hook solo trae ese mes). Ampliarlo necesita un dato nuevo de la capa de datos: preguntar antes.
- Desktop: el contenido sigue en una columna de 880 px; la `Sheet` se centra en la ventana; los medidores de Reportes se estiran a todo el ancho.
- Entrada de texto natural ("café 3500"): no implementada; `CK.parse` de `docs/ui-redesign/concepts/common.js` es la referencia.
- Reportes: los porcentajes de la leyenda se redondean por separado (pueden sumar 99 o 101). El termómetro de ritmo ya está (`feature/ui-reports-pace`); el día en que aparece (4) y la tolerancia (±10 %) fueron aprobados por el usuario.
- Gastos fijos: Deshacer dura lo que el toast (8 s); después, el pago se anula desde Movimientos. A 320 px "Pagar" baja a un renglón propio.
- Perfil: `useAllTransactions` no distingue "cargando" de "sin movimientos" (los botones de exportar arrancan deshabilitados un instante).
- Ingreso: después de registrarse la contraseña se vacía, así que "Reenviar correo" pide escribirla de nuevo.
- `.impeccable/config.json` guarda ignores del detector (3 entradas, con motivo); `.claude/` y `.impeccable/` están **sin commitear a propósito**.

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

**Aprendido en las sesiones de noviembre (PRs #9 a #12):**
- El scratchpad cambia de ruta entre sesiones: usar el que indique el entorno de la sesión actual.
- `sleep` en Bash está bloqueado. Los emuladores tardan ~20 s en levantar: si el seed da "fetch failed", esperar y reintentar.
- Preview de Vercel: `…/deployments?per_page=1` y su `statuses_url`; comprobar que el `sha` sea el de la rama (tarda más de un minuto; el filtro `?sha=` necesita
  el sha completo). Consultar una vez; si no está, decir que Vercel lo comenta en el PR.
- Usuarios de prueba (solo emulador): `ana@prueba.test` lo crea el seed. Para probar registro y verificación, crear uno nuevo desde la UI, abrir su `oobLink`
  (`http://127.0.0.1:9099/emulator/v1/projects/financial-app-beta/oobCodes`) y crear `betaInvites/<email>` con un PATCH al emulador de Firestore con
  `Authorization: Bearer owner` (como hace el seed). Un usuario verificado sin invitación muestra la activación denegada.
- Leer Firestore del emulador para verificar una escritura: REST `http://127.0.0.1:8080/v1/projects/financial-app-beta/databases/(default)/documents/<colección>`
  con `Authorization: Bearer owner`.
- Navegador integrado: el preset `mobile` (o cualquier ancho < 768) emula un Chrome de Android; sirve para ver la guía de instalación de Android, no la de iPhone
  (esa se ve desde el desplegable "Tengo otro celular o navegador"). Para interactuar de forma confiable, `javascript_tool` con clicks por texto y el setter nativo
  de `value` + evento `input` (ese camino saltea `maxLength`). Para verificar descargas sin bajar archivos, interceptar `URL.createObjectURL` y leer el Blob
  (el BOM se comprueba con `arrayBuffer`; `text()` lo quita).
- Código escrito con heredocs de Bash pierde barras invertidas y caracteres especiales (regex, BOM, `\n`): escribir archivos con Write/Edit; para parches con
  CRLF o espacios duros, un `.mjs` creado con Write y ejecutado con `node`.
- Los informes de los agentes ejecutores no son prueba: hubo uno que dio por "sin uso" un archivo que sí se importaba y un token CSS inexistente
  (`--fs-display-sm`). Revisar el diff y comparar los `var(--…)` nuevos contra `tokens.css`.
- No usar `git rm --cached` ni dejar de trackear capturas viejas: cuenta como borrado y necesita OK.
- En los cuerpos de PR, contar las pruebas nuevas (diferencia entre corridas), no estimarlas.
- **Casos extremos (unidad B):** `node scripts/seed-worstcase.js` crea `peor@prueba.test` (límites reales del servidor: cuenta de 40 caracteres, descripción de 200, saldo de 12 cifras,
  emoji, topes de $ 1 y de $ 999.999.999) y `vacio@prueba.test` (activado y sin datos), ambos `Prueba-1234`, solo emulador. Probar con `ana` **y** con `peor`: `ana` sola no mostró 4 roturas
  que `peor` sí (zoom 200 % con cifras de 15 cifras, frecuentes cortados, rótulos de la barra pisados, Entró/Salió partidos).
- **Playwright** (`mcp__playwright__*`, cargar con ToolSearch): `browser_run_code_unsafe` recibe `page`; no tiene `require` y solo lee archivos dentro del repo (por ejemplo `.playwright-mcp/`, ignorado por git).
  Para cambiar de usuario: `localStorage.clear(); sessionStorage.clear(); indexedDB.deleteDatabase(...)` desde la página y recargar. Para los emuladores no hace falta el panel: `page.context().setOffline(true)` prueba el error de sin conexión.
  Los PDF se bajan con `page.waitForEvent('download')` + `saveAs` dentro del repo y se miran con `Read` (renderiza las páginas).
- Una captura sacada justo después de cambiar de tema (`body.light-theme`) pilla los colores a mitad de transición (botones que parecen grises): esperar ~500 ms.
- El lint local también recorre `.playwright-mcp/` (el CI no, porque está ignorado): borrar los scripts de prueba que se dejen ahí.
- Otro proceso de Claude puede estar usando esta misma carpeta (puertos 9099, 8080, 5002 y 5173 ya ocupados al empezar la unidad B). En la unidad B se vació su Firestore del emulador con `DELETE` y se volvió a sembrar: avisar antes de repetirlo.
- Con `:has()`: el aviso (`Toast.module.css`) mira `body:has([role='dialog'])`; las hojas y diálogos se desmontan al cerrar (verificado: 0 `[role=dialog]` en reposo). Un `motion.div` deja `opacity` inline: para ocultarlo desde CSS hace falta `!important`.

## 9. Protocolo de git por pantalla

1. `git checkout main && git pull --ff-only origin main && git checkout -b feature/ui-<pantalla>` (si hay un PR abierto del que dependés: avisar y esperar el merge).
2. Trabajar, commitear en pasos chicos (convencionales, sin líneas de atribución).
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
- "Dejemos de inventar la rueda": investigar apps reales y construir sobre eso (hecho).
- Autorizó borrar `Toast.css`, `ConfirmDialog.css`, `App.css`, `AddTransactionModal.css` y `TransactionList.css` (ya borrados). El 2026-11-15 autorizó también borrar `public/icons.svg` (plantilla de Vite) y la lista de limpieza
  (`SubscriptionsManager.css`, `LandingPage.css`, `SubscriptionsCard.jsx`, `ExpenseChart.jsx`, `.budget-alert`, dos capturas viejas, `recharts`). **No autorizó** ningún otro borrado.
- **Unidad B (accesibilidad):** el aviso ("Listo: …") se oculta mientras hay una hoja o un diálogo abierto (`Toast.module.css`, con `:has`); la navegación va antes del contenido en el DOM.
  Dos hallazgos de `break-ui` los resolvió el usuario dejándolos como están (descripciones largas en un campo de un renglón; centavos redondeados a pesos enteros en las listas): no volver a plantearlos. Ver `pr-a11y.md`.
- **Ícono de la PWA:** pidió que lo propusiera yo; eligió la opción **A** (puntos naranja sobre oscuro, `docs/ui-redesign/pwa/`). Aprobó el cambio de `vite.config.js` para esta unidad.
- **Barra de estado de iOS:** `black` (decisión mía, a revisar en un iPhone real: con el tema claro queda una barra negra).
- Mergeó él los PRs #5 a #12.
- **Cifras protagonistas en Doto:** no le gustó la mono para el "gasto mensual estimado" de Gastos fijos; quedó en Doto con el "$" naranja, como el saldo del Inicio. Aprobado.
- **Landing: "Instalar la app" es la acción principal** e "Ingresar" la secundaria. No revertirlo.
- **Instrucciones para gente no técnica:** pidió que quien no sabe qué es "el menú del navegador" pueda instalar la app. Regla general de copy: decir qué dibujo
  buscar, dónde está en la pantalla y qué tocar; sin jerga.
- Pidió probar en formato iPhone cuando fue posible.
- Quiere respuestas breves; los cierres de turno traen: qué cambió, cómo se verificó, qué no se probó y **una sola pregunta** con botones.
- Si dice que no hace falta comprobar algo (un merge, el CI), no comprobarlo en ese turno.

## 12. Preguntas abiertas para el usuario

Las dos primeras están respondidas. Las demás (3 a 8) siguen abiertas: no resolverlas por cuenta propia.

1. ~~Borrados~~: respondida y aplicada en `feature/ui-cleanup` (sección 11).
2. ~~Ícono propio de la PWA~~: respondida y hecha (opción A, sección 11).
Respuestas del usuario (2026-11-15, después de cerrar el rediseño; dejó el orden y la forma a criterio del asistente). Se implementan en PRs aparte, uno por vez:

3. ~~Categorías de Gastos fijos~~: **sí, unificar con las 6 de la app.** Hecho en `feature/ui-categories-csv` (`pr-categories-csv.md`).
4. ~~CSV para Excel~~: **sí, que se lea bien en Excel.** Hecho en la misma rama (`;`, coma decimal).
5. Frecuentes de varios meses: se le explicó (hoy "Anotar rápido" solo mira los movimientos del mes que se está viendo: el día 1 de cada mes aparece vacío) y **dijo "Sí, 3 meses"**: los frecuentes salen
   de los últimos 3 meses. **Autorizó tocar la capa de datos para esto**, solo para leer (sin cambiar `functions/`, `api/`, reglas ni lo que devuelven los hooks existentes: lo razonable es un hook nuevo de solo lectura
   con la consulta `transactions(userId, occurredAt)` de los últimos 3 meses). Va al final de la cola (después de texto natural, termómetro y dos columnas).
6. ~~Texto natural~~ HECHO en `feature/ui-natural-entry` (`pr-natural-entry.md`; pendiente su veredicto sobre el diseño, y se le avisó que se construyó antes de mostrárselo). **Texto natural ("café 3500") para anotar un movimiento: sí, quiere volver a eso.** "A mí me gustaba mucho más el texto natural que como está armado ahora la pantalla de ingresar un movimiento": no es un
   agregado, reemplaza como camino principal al formulario de la hoja. Referencia del analizador: `docs/ui-redesign/concepts/common.js` (`CK.parse`).
7. Dos columnas en escritorio: **preguntó cómo se arregla.** Propuesta del asistente: desde 1024 px, Inicio en dos columnas (saldo, anotar rápido, para pagar y cuentas a la izquierda; Movimientos a la derecha),
   Reportes y Gastos fijos igual, Perfil sigue en una columna.
8. ~~Termómetro de ritmo en Reportes~~: **sí** ("perfecto"). Hecho en `feature/ui-reports-pace` (`pr-reports-pace.md`). Dentro de "00 Topes del mes", solo mes en curso con algún tope. **Aprobado por el usuario (2026-11-16, "Así está bien")**: se oculta los días 1 a 3 (`PACE_FIRST_DAY`) y "en ritmo" es ±10 %. No volver a plantearlo.
