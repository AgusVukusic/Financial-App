# Anotar un movimiento escribiendo ("café 3500") (decisión 6)

## Qué cambia en producción

La hoja **"Nuevo movimiento"** (botón Anotar y los botones "Anotar un gasto" / "Anotar el primero") ya no pide un monto en un campo aparte. Escribís qué y cuánto en un solo renglón, la app muestra **cómo lo entendió** y lo corregís con un toque antes de guardar:

- `café 3500` → "Leí **$ 3.500** · Café · **Comida**", cuenta por defecto, hoy.
- `nafta 3,5k` → $ 3.500 · Transporte. `super 30 mil` → $ 30.000. `regalo 2 lucas` → $ 2.000. `farmacia 1.250,75` → $ 1.250,75.
- `sueldo 1.850.000` → pasa a **Ingreso** solo (palabras como sueldo, aguinaldo, cobré, freelance, "me pagaron").
- `uber 4500 efectivo ayer` → cuenta Efectivo y fecha de ayer; esas dos palabras no quedan en la descripción. También `anteayer` y `hoy`.
- La categoría se adivina por la palabra (café, nafta, edenor, alquiler, zapatillas…); si no hay pista, "Otros". **Lo que tocás a mano manda**: si elegís otra categoría, otra cuenta, otro tipo o otra fecha, el texto deja de cambiarlo.

Cómo se lee el número, que es donde más se puede equivocar: el punto separa miles (`1.500` = mil quinientos), la coma es decimal (`3,5`), `k` o `mil` multiplican por 1.000. Si hay varios números (`3 empanadas 4500`) se toma el que lleva `$`, `k` o `mil`, y si no, el más grande. La confirmación aclara cómo leyó un número dudoso y **muestra los centavos tal como se guardan** (`$ 3,5`, no `$ 4`).

- **La cuenta va en botones** (pedido tuyo después de ver la primera versión): un toque elige; el nombre largo se acorta con "…" y el botón sigue siendo de 44 px. En transferencias, "Desde" y "Hacia" también son botones.
- **Editar un movimiento que ya existe**: sigue el formulario completo (Monto, Categoría, Fecha y descripción), con la cuenta también en botones.
- **Transferencias:** el tipo se elige a mano y las cuentas Desde/Hacia también. El texto no elige cuenta ahí (¿origen o destino?) y la palabra queda en la descripción.
- La descripción se recorta a 30 letras (el límite del formulario de antes) y la confirmación lo avisa.
- El botón dice lo que va a guardar: **"Guardar gasto · $ 3.500"**.
- Con Enter en el campo también se guarda. Si no se encuentra un monto, mientras escribís solo orienta ("Falta el monto…", sin rojo); al intentar guardar, avisa con ícono y texto.

No cambia nada en el servidor ni en lo que se guarda: el movimiento sale por el mismo `onAdd` (`type`, `amount`, `category`, `accountId`, `description`, `date`, `requestId`), con el mismo reintento sin duplicar.

## Capturas

`docs/ui-redesign/natural-entry/`: `01` hoja vacía, `02` "uber 4500 efectivo ayer" (oscuro), `03` solo "café" (orienta, sin rojo), `04` "sueldo 1.850.000" como ingreso (claro), `05` descripción larga a 320 px, `06` centavos, `07` escritorio, `08` a `10` cuentas como botones (393 px oscuro, 320 px claro y transferencia).

## Cómo probarlo

1. Anotar → escribir `café 3500` → ver "Leí…" → Guardar. El gasto aparece en Movimientos y el saldo baja $ 3.500.
2. Probar `nafta 3,5k`, `sueldo 1.850.000`, `uber 4500 efectivo ayer`, `compra grande del mes en el mayorista 45.000`.
3. Elegir una categoría a mano y seguir escribiendo: la elegida se mantiene.

## Verificación

- **Pruebas: 333 → 390** (43 del analizador `utils/naturalEntry.js`, más las de la hoja reescritas para escribir en vez de llenar campos). Lint 0 errores (9 avisos). Build OK.
- **Cuentas como botones** (navegador, usuario `peor` con nombres largos, 320/393/1100 px, claro y oscuro): todos de 44 px o más, sin desbordes; solo un nombre de 38 letras se acorta con "…" a 320 px (queda del ancho completo).
- **Contra el emulador** (usuario `peor`): anotar `prueba natural 3500 efectivo` bajó el saldo de la cuenta Efectivo en 350000 centavos (-10.490.040.060 → -10.490.390.060) y creó un movimiento `expense / OUT / 350000`, descripción "Prueba natural", categoría "Otros" y esa cuenta.
- **Navegador (Playwright)**, hoja abierta a 320, 393 y 1100 px, claro y oscuro y a 320 px con texto al 200 %: ningún objetivo menor de 44 px, sin scroll lateral, el botón de guardar libre (medido sin mover la hoja), la confirmación sin desbordes con una descripción larga ("compra grande del mes en el mayorista 45.000 efectivo ayer").

## Diferencias con el concepto que te gustaba (`concepts/k3`)

Mantiene el renglón de texto, el resaltado del monto, la frase "Leí…" y las correcciones con toques. **No incluye** (decisiones mías, se pueden agregar): el teclado numérico propio; y el botón dice "Guardar gasto · $ 3.500" en lugar de "Anotar · $ 3.500". Entiende también ingresos y transferencias (el concepto era solo de gastos).

## No probado / límites

- **Teclado del iPhone y de Android**: cambiar de letras a números al escribir `café 3500`, el autocorrector (desactivé `autocorrect` y mayúsculas automáticas, pero Safari no se probó), el dictado ("café tres mil quinientos" no se entiende: solo cifras) y lo que anuncia un lector de pantalla mientras se escribe.
- El analizador es de palabras clave: una palabra que no conoce cae en "Otros" (se corrige con un toque). Los nombres de cuentas se reconocen por el nombre completo, las iniciales o la primera palabra si va al final (`super 30000 visa`); una palabra suelta del medio no alcanza.
- No lee fechas escritas (`12/11`), solo `ayer`, `anteayer` y `hoy`.
- La descripción se corta a 30 letras (decisión anterior que se dejó como estaba).
- Los frecuentes ("Anotar rápido") no cambian en este PR.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
