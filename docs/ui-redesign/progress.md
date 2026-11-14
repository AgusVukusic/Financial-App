# Rediseño de UI — estado

## Fase actual

**Dirección elegida (2026-11-13): "3 · Panel de taller"** (hardware: teclas con relieve, rótulos de panel mono, saldo en
puntos Doto, un solo acento naranja, tramas/dither para distinguir categorías, entrada por texto "café 3500").
Por qué: al usuario "le fascinó"; cumple saldo primero, estado por texto/ícono/forma y registro rápido.

Fase 3 (sistema de diseño) implementada en la rama `feature/ui-design-system`: tokens claro/oscuro (`src/styles/tokens.css`),
componentes base rehechos y nuevos (`src/components/ui/`), página de muestra `/showcase.html` (solo dev), guía en
`docs/ui-redesign/design-system.md`, capturas en `docs/ui-redesign/system/`. ✋ Esperando OK del usuario antes de la fase 4
(rediseño pantalla por pantalla, empezando por Layout/navegación).

## Respuestas de gusto (fase 1)

- Sin referencias favoritas ni rechazos; quiere ver opciones para imaginarlas.
- Color: sin preferencia, pero lo que necesite distinguirse (ingreso/gasto, estado de presupuesto, vencimientos) debe
  distinguirse claramente.
- Tema: oscuro algo más usado, pero claro y oscuro valen lo mismo.
- Prioridad en la primera pantalla: el saldo total.

## Fase 2: direcciones presentadas

Mock: `docs/ui-redesign/direcciones.html` (artifact privado: https://claude.ai/artifact/5PBRy92EceE4Czj3VMHj82).
Mismo esqueleto en las tres (saldo total, "Anotar gasto" a un toque, cuentas, para pagar, presupuestos, movimientos,
navegación inferior); cambia solo el mundo visual. Datos tomados de la app local con el seed.

- **A · Libro mayor** (asignada por el sorteo de impeccable, `seed:6342458530589db0`, candidato 4 de mi lista).
  Firma: doble raya de cierre bajo el saldo y columnas Salió/Entró. Schibsted Grotesk + Spline Sans Mono; tinta azul
  de cuaderno para acciones. Mejora tomada del tablero split-flap: cifras tabulares en celdas fijas.
- **B · Línea de subte** (mi elección propia). Firma: barra de línea con el gasto del mes por categoría; cada categoría
  tiene letra y color de línea. Archivo. Los colores de categoría nunca se usan para estados.
- **C · Estándar de la categoría** (la puerta fija). Geist, tarjetas redondeadas, acento azul. Sin recomendación.

Desafiantes del catálogo evaluados y no usados: split-flap (competitivo, aportó la mejora a A), marketing monocromo,
página de referencia con riel central, catálogo Saville, catálogo de ferias y atlas estelar (descartados por costume
de herramienta o por no cargar la tarea).

**Preferencia declarada:** B (subte) fue la que más gustó, pero quiere explorar más alternativas.

### Tanda 2 (re-roll 1, 2026-11-13; misma página, versión 2)

Mi lista nueva (7): sobres, boleta de servicios, billete, ticket de caja, chequera, cartel de góndola, tarjeta de feria.
Asignada por el sorteo: el 6.º, cartel de góndola.

- **D · Cartel de góndola** (asignada). Saldo como etiqueta amarilla de precio, categorías como números de pasillo.
  Big Shoulders Display + Hanken Grotesk. Mejora tomada del mosaico Metro: un solo color dueño de lo "vivo".
- **E · Sobres** (mi elección). Presupuestos como sobres de color con solapa y nivel. Onest.
- **F · Billete**. Franja violeta con guilloché detrás del saldo y sellos circulares. Barlow Condensed + Libre Franklin.

Desafiantes de esta tanda evaluados y descartados: mosaico Metro (aportó la disciplina del color único), mapa de zoológico,
labanotación, folio botánico, catálogo de ferias.

### Tanda 3 (re-roll 2, registro "bolder", misma página, versión 3)

Pedido del usuario: algo más arriesgado y con más identidad; **B sigue liderando**. El registro "bolder" no presenta
direcciones propias: se muestran los desafiantes del catálogo, el primero (por el sorteo) lidera.

- **G · Consumo cálido** (líder por el sorteo, la menos audaz). Un solo color de acción solo en lo tocable.
- **H · Cuadrícula** (Crouwel). Saldo dibujado celda por celda sobre plano azul con retícula visible. La más rara.
- **I · Mapa de red** (diagrama de red nocturno). Evolución de B: el color es la cuenta, no la categoría; cada movimiento
  es una estación sobre la línea de su cuenta y las transferencias son combinaciones.
- **J · Pase de abordar**. Saldo como pase con perforación; "Para pagar" como tablero ordenado por vencimiento, con un
  único color de alerta.

Descartados: tablero de horarios de bolsillo con vidrios (jerarquía solo por peso, pierde al saldo como protagonista) y
split-flap (ya evaluado, aportó la idea de cifras tabulares a A).

Pendiente de la tanda 3: las categorías no tienen color propio en I y J; si el usuario quiere conservar el color por
categoría de B, hay que decidirlo en la mezcla.

### Investigación y conceptos de síntesis (2026-11-13)

Pedido del usuario: "dejemos de inventar la rueda": investigar apps, animaciones y patrones en la web (también lo
arriesgado) y crear algo nuevo con eso. Se usaron 5 agentes de investigación (Sonnet, esfuerzo medio): apps de finanzas,
animación, visualización del dinero, registro rápido y gestos, identidades visuales. Algunas URLs de los informes no
fueron verificadas por los agentes (ellos lo indican); no se pudieron leer Mobbin, Cash App ni Cleo.

Hallazgos que guían el diseño: chips de frecuentes (1 toque + Deshacer) y entrada de texto natural; saldo con odómetro;
frascos/sobres con nivel; "termómetro de ritmo" (gastado vs esperado a la fecha); nada se distingue solo por color.

Prototipos interactivos (anotar, pagar, deshacer; claro y oscuro): `docs/ui-redesign/concepts/` (`common.js` datos y
helpers, `k1/k2/k3.{js,css}`, `build.mjs`, `check.mjs`, `concepts.html` generado). Artifact:
https://claude.ai/artifact/3T8A5zwQJiYShew8WV2Vxy
- **1 · Estación** (subte evolucionado: odómetro, termómetro de ritmo, próximas paradas, hoja con teclado).
- **2 · Frascos** (neobrutalismo, frasco del mes, frascos por categoría con trama al pasarse, tickets dentados).
- **3 · Panel de taller** (hardware: saldo en Doto, anotar escribiendo "café 3500", dither por categoría).
Hechos por 3 agentes (Sonnet, esfuerzo medio) sobre una base común; revisión visual del asistente en 375 px.
Corregido en la revisión: especificidad del reset de botones, chips de K1 que se solapaban, "Vencido · vencido".
Pendiente conocido: K3 tiene etiquetas de panel de 10-11 px y una fila de fijos apretada; no se probó en celular real.
Los `concepts.k*.html` son salidas temporales de build por agente (se pueden borrar).

Convenciones comunes de la tanda 1: el gasto va en tinta neutra con signo menos; el verde es solo "entró" (con signo +);
el rojo y el ámbar son solo estados y siempre con ícono y texto; contraste AA verificado por cálculo en las 6
combinaciones; objetivos de 44 px o más; sin editar/borrar en cada fila.

## Decisiones

- Skills: `impeccable` (auditoría/rediseño), `mobile-native`, `break-ui`, `animate`, `animation-performance`, `dataviz`,
  `artifact-design`. No están instaladas `emil-design-eng`, `review-animations` ni `apple-design`.
- Dirección elegida: pendiente.
- La capa de datos no se toca (`functions/`, `api/`, `firestore.rules`, `src/services/api.js`, `src/utils/money.js`,
  `src/utils/mappers.js`, contratos de los hooks). Grupos queda afuera.
- Se usó la página de comparación (artifact) en lugar de la página de decisión de impeccable (`serve-question`).
- `PRODUCT.md` creado en la raíz a partir del repo y de tus respuestas. Inferido, a confirmar: "varias veces por
  semana", "círculo chico", uso de una mano.

## Entorno local

- `.claude/launch.json` define `emulators`, `dev-api` y `vite` (5173). `.env.development.local` (ignorado por git)
  apunta el frontend a los emuladores con `VITE_API_TRANSPORT=http`.
- `node scripts/seed-emulators.js` crea el usuario de prueba y carga cuentas, movimientos, presupuestos y gastos fijos.
  Los emuladores no persisten: al reiniciarlos hay que volver a correr el seed.

## Entregables

- `docs/ui-redesign/audit.md` + `audit/` (26 hallazgos, 8/20, 20 capturas).
- `docs/ui-redesign/direcciones.html` (fase 2).
- `PRODUCT.md`.

## Estado de git (2026-11-13)

Rama `feature/ui-design-system` subida a origin (el primer push dio 403 por credenciales; el segundo intento funcionó). Todavía sin PR:
lo abre el usuario desde GitHub (no hay `gh`); el cuerpo está en `docs/ui-redesign/pr-design-system.md`. El CI (`test.yml`) corre al abrir el PR
hacia `main`, no en pushes de ramas. Vercel generó preview de la rama.

Prueba en formato iPhone (393×852, dpr 2, táctil) en el navegador integrado: UA de Chrome Android, no Safari iOS, así que no
cubre safe areas reales, el modo instalado ni el comportamiento de iOS al enfocar inputs. Resultado: sin scroll horizontal; en el
Dashboard solo los 3 botones de la navegación miden 40 px (Layout, fase 4); el flujo anotar gasto → aviso con el sistema nuevo funciona.

## Fase 4: pantalla por pantalla

- **Layout/navegación** (rama `feature/ui-layout`, 2026-11-14): barra inferior anclada de 4 destinos con rótulo siempre visible, `aria-current`,
  tecla "Anotar" de acento, área segura; riel lateral desde 768 px; salto al contenido; `AppHeader` (saludo sin emoji + tema con
  `aria-label`; en Gastos fijos, botón Volver); `MonthSelector` (botones de 44 px, mes anunciado). Capturas en `docs/ui-redesign/layout/`.
  `App.css` quedó sin uso (ya no se importa): pendiente de borrar con OK.

- **Dashboard** (misma rama `feature/ui-layout`; un solo PR Layout + Dashboard porque tocan `App.jsx` y la regla pide no apilar PRs):
  saldo total en Doto con `Odometer` (escala con el ancho de la tarjeta; mono si pasa de 12 caracteres), Entró/Salió con signo y flecha,
  **Anotar rápido** (hasta 6 frecuentes del mes; un toque registra un gasto de hoy y el aviso trae **Deshacer**), **Para pagar**
  (vencidos / por vencer con ícono y texto, plural correcto), **Cuentas** en lista vertical con rótulo "Deuda". `TransactionList`
  queda para la pantalla 4. Capturas en `docs/ui-redesign/dashboard/`.
  - Contrato verificado sin tocar la capa de datos: el id del documento de un gasto es el `requestId` que manda el cliente
    (`functions/finance/transactions.js`, ADR 001), así que Deshacer = `voidTransaction(requestId)`. Probado de punta a punta en el
    emulador: el toque baja el saldo, Deshacer lo devuelve y no queda fila visible.
  - Limitación: los frecuentes salen de los movimientos del mes seleccionado (el hook solo trae ese mes); al empezar un mes nuevo
    no hay frecuentes hasta que se cargue algo. Ampliarlo pediría un dato nuevo de la capa de datos (preguntar antes).
  - Movimiento: la prueba con `prefers-reduced-motion: no-preference` (Playwright) confirma el odómetro rodando ~0,8 s a 80 fps;
    el panel integrado emula "reducir movimiento".
  - break-ui: no se corrió la skill; se hicieron casos extremos a mano y en pruebas (320 px, cifras de 15 dígitos, nombres largos,
    sin cuentas, sin frecuentes, mes distinto del actual). Encontró y corrigió un desborde del saldo a 320 px.

- **Modales de movimiento y cuenta** (rama `feature/ui-transaction-sheet`, desde `main` con #5 y #6 mergeados): ahora son hojas inferiores sobre `Sheet`
  (`AddTransactionModal`, `AddAccountModal`; mismas props, lógica de guardado y `requestId` intactos). Monto primero con teclado decimal y foco,
  categorías como botones, fecha/descripción plegadas, transferencia apilada (corrige el desborde de la auditoría), validación inline con ícono y texto.
  `useDialogA11y` ahora tiene pila: una confirmación sobre una hoja atiende Escape sola. Capturas en `docs/ui-redesign/sheets/`.
  Archivos sin uso pendientes de borrar con OK: `src/App.css`, `src/components/AddTransactionModal.css`.

- **Movimientos (lista)** (misma rama `feature/ui-transaction-sheet`; un solo PR con las hojas, porque la lista abre la hoja de edición): renglón de un solo botón,
  transferencia con origen → destino, 20 + "Ver los N restantes", eliminar dentro de la hoja con confirmación (`DialogContext.confirm` ahora admite
  `{ confirmText, destructive }`; usar `destructive: false` al rehacer Gastos fijos para que pagar no sea rojo). Capturas en `docs/ui-redesign/transactions/`.
- **Riesgo corregido**: `type="number"` leía "1.500" como 1,5 (probado con es-AR). Ahora `parseAmountInput` (`src/utils/amountInput.js`, 29 pruebas) en el monto
  y en el saldo inicial de la cuenta.
- CI de `main` verificado en verde (check-runs de #5 y #6).
- Borrados con OK del usuario: `src/App.css`, `src/components/AddTransactionModal.css` y `src/components/TransactionList.css` (ya no se importaban). `GroupDetails.jsx` (fuera de la Beta, inalcanzable) usaba las clases `.modal-overlay`/`.modal-content` de ese CSS: si vuelve, necesita su propio rediseño.

## Pantallas terminadas / PRs

PR #5 (sistema de diseño) mergeado. PR #6 (Layout + Dashboard) mergeado.
## Pendiente

- OK del usuario al sistema de diseño (fase 3), luego fase 4: Layout/navegación → Dashboard → modal de transacción → ...
- Confirmar el hallazgo 7 (login sin verificar) como arreglo en `App.jsx`/`WelcomeScreen.jsx`.
- (Hecho) `Toast.css` y `ConfirmDialog.css` borrados con OK del usuario.
- Ícono propio de la PWA y `apple-touch-icon`; cache offline de las fuentes.
