# Sistema de diseño: Panel de taller

Fase 3 del rediseño. Base elegida: el concepto 3 de `docs/ui-redesign/concepts/` (estética de instrumento: teclas con
relieve, rótulos de panel, un solo color vivo). Para verlo: `npm run dev` y abrir `http://localhost:5173/showcase.html`
(solo desarrollo, no entra al build). Capturas en `docs/ui-redesign/system/`.

## Reglas

1. **El acento (naranja) es solo "se puede tocar"**: botón principal, numerales de sección, indicador de pestaña activa.
   Nunca marca un estado.
2. **Estado = texto + ícono (+ forma)**, nunca solo color. `--in` (entró) va con signo +; `--bad` (vencido, superado, error)
   y `--warn` (cerca del límite) van con ícono y palabra. El gasto va en tinta neutra con signo −.
3. **Objetivos táctiles de 44 px o más** (`--tap`); el botón principal y las teclas grandes, 56 px (`--tap-lg`).
4. **Claro y oscuro valen lo mismo**: el tema sigue al sistema hasta que la persona elige (`useTheme`).
5. **Movimiento con función**: solo `transform` y `opacity`; con "reducir movimiento" el odómetro y las hojas cambian de golpe
   o con un fundido (`MotionConfig reducedMotion="user"` + `prefers-reduced-motion`).
6. **Cifras en mono tabular** (`--font-mono`); el saldo grande en Doto (`--font-dot`) a 48 px o más.

## Tokens (`src/styles/tokens.css`)

| Grupo | Tokens |
|---|---|
| Color | `--bg` `--surf` `--chip` `--ink` `--ink2` `--rule` `--acc` `--onacc` `--in` `--bad` `--warn` |
| Tipografía | `--font-ui` (Hanken Grotesk) `--font-mono` (Geist Mono) `--font-dot` (Doto); `--fs-label` 11, `--fs-small` 13, `--fs-body` 15, `--fs-lead` 17, `--fs-title` 20, `--fs-num` 24, `--fs-display` 48 |
| Espaciado | `--sp-1..7` = 4, 8, 12, 16, 24, 32, 48 px |
| Radios | `--r-xs` 3, `--r-sm` 4, `--r-md` 8, `--r-lg` 10, `--r-xl` 12, `--r-pill` |
| Bordes y teclas | `--bw` 1, `--bw-strong` 2, `--key-depth` 3, `--tap` 44, `--tap-lg` 56 |
| Movimiento | `--ease-out`, `--dur-1` 80 ms, `--dur-2` 160, `--dur-3` 280, `--dur-odo` 800 |
| Capas | `--z-nav` 50, `--z-sheet` 100, `--z-toast` 200, `--z-dialog` 300 |

Tema: `body.light-theme` (lo pone `useTheme`) o `data-theme="light|dark"` en cualquier subárbol.

**Alias de la versión anterior** (`--bg-base`, `--text-primary`, `--accent-primary`, `--spacing-*`, `--radius-*`, etc.): siguen
definidos en `tokens.css` para que las pantallas que aún no se rehicieron lean el sistema nuevo. No usarlos en código nuevo;
se borran cuando se rehaga la última pantalla.

### Contraste (calculado)

Texto vs `--bg`, `--surf` y `--chip`: todos los pares de `--ink`, `--ink2`, `--in`, `--bad` y `--warn` dan 4,5:1 o más en los dos
temas. `--acc` como texto sobre `--bg`/`--surf` también; **no usar `--acc` como texto sobre `--chip` en claro (3,97:1)**.
`--onacc` sobre `--acc`: 6,76:1 oscuro, 5,34:1 claro. Los filetes `--rule` son decorativos (1,5:1); los bordes que identifican un
control (inputs, teclas, chips) usan `--ink2` (6,4:1 o más).

## Componentes (`src/components/ui/`, import desde `components/ui`)

| Componente | Para qué | Notas de accesibilidad |
|---|---|---|
| `Button` | Teclas. `primary`, `key`, `outline`, `ghost`, `danger`, `success`; `sm/md/lg`; `isIcon`, `block` | 44 px o más; `isIcon` exige `aria-label` |
| `Card` | Superficie con filete. `plain`, `dotted`, `dashed` | |
| `Chip` | Categorías, cuentas, frecuentes. Con `pressed` es interruptor | `aria-pressed` + tilde, no solo color |
| `Tag` | Sello de estado (`neutral`, `accent`, `dashed`, `ok`, `warn`, `bad`) | Siempre con texto; ícono para alertas |
| `Meter` | Medidor de presupuesto de 10 segmentos; exceso rayado aparte; sin tope = línea punteada | `role="meter"` con `aria-valuetext` |
| `Dither`, `DitherBar` | Tramas en tinta para distinguir categorías sin color | Gráfico con `aria-label`; la leyenda en texto va aparte |
| `Odometer` | Cifra que rueda al cambiar | `role="img"` con el valor completo; dígitos ocultos |
| `SectionHeader` | Numeral naranja + título mono + resumen | Encabezado real (`h2` por defecto) |
| `Field` | Etiqueta, ayuda y error conectados al control | `for`/`id`, `aria-describedby`, `aria-invalid`; error con ícono |
| `Input`, `Select` | 48 px de alto, 16 px de fuente | Foco con anillo de acento |
| `Sheet` | Hoja inferior modal | `role="dialog"`, foco atrapado, Escape, botón Cerrar visible |
| `ConfirmDialog` | Confirmación centrada (`alertdialog`) | Foco inicial en "Cancelar"; `hideCancel` para avisos |
| `ToastProvider` / `useToast` | Avisos abajo. `showToast(msg, tipo, ms, { action })` | `role="status"`/`alert`; con acción dura 8 s o más |

`useDialogA11y` (hook) encapsula foco, Tab, Escape y bloqueo de scroll; lo usan `Sheet` y `ConfirmDialog`.

## Lo que queda para las pantallas

- Reemplazar los `style={{...}}` y los CSS por pantalla por tokens y componentes (fases 4 y siguientes).
- Mover el modal de transacción y el de cuenta a `Sheet`.
- Ícono de la PWA propio (hoy es una URL externa en `vite.config.js`) y `apple-touch-icon`.
- Fuentes de Google en `index.html`: con `display=swap`; sin cache offline propia (la PWA no las precachea todavía).
- Archivos sin uso: `src/components/ui/Toast.css` y `ConfirmDialog.css` (reemplazados por módulos), pendientes de borrar con tu OK.
