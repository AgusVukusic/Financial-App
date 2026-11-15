# Accesibilidad, movimiento y casos extremos (fase 5, unidad B)

## Qué cambia en producción

- **Con el texto grande (200 %) nada ensancha la pantalla.** Antes, a 320 px el saldo, las etiquetas ("VENCIÓ HACE 3 DÍAS"), el encabezado de Gastos fijos y los botones de los diálogos empujaban la pantalla hacia los costados. Ahora el saldo se achica hasta entrar, y las etiquetas, encabezados y botones bajan de renglón.
- **Con teclado, en escritorio, el riel de la izquierda es lo primero que alcanza Tab** (antes era lo último, después de toda la pantalla). En el celular no cambia nada que se vea.
- **El aviso verde ("Listo: …") ya no tapa el botón de abajo de una hoja.** Pasaba al volver a abrir una hoja mientras el aviso seguía visible (por ejemplo "Guardar tope"): el aviso quedaba encima y se llevaba el toque. Ahora se oculta mientras hay una hoja o un diálogo abierto y vuelve al cerrarlos.
- **"Ver el movimiento restante"** cuando queda uno solo por mostrar (antes decía "Ver los 1 restantes").
- **PDF de movimientos:** los montos ya no se parten en dos renglones cuando hay una descripción larga ("$ 1.250." / "001"), la fecha entra en un solo renglón y los emoji se quitan de las descripciones (salían como basura: "Ø>Ý"). El CSV conserva los emoji.
- Solo desarrollo: `scripts/seed-worstcase.js` carga los datos de peor caso en los emuladores. No se publica nada.

## Cómo probarlo

1. `npm ci && npm run lint && npm test && npm run build`.
2. Texto grande: en el celular, Ajustes → Pantalla → Tamaño de la fuente al máximo, y mirar Inicio y Gastos fijos (o en el navegador de escritorio, zoom al 200 %). No debe haber desplazamiento lateral.
3. Aviso: Reportes → tocar un tope → Guardar tope → tocarlo de nuevo enseguida: el botón "Guardar tope" tiene que responder.
4. PDF: Perfil → Exportar PDF con una descripción larga y otra con emoji.
5. Peor caso (local): `npm run emulators`, `npm run dev:api`, `node scripts/seed-worstcase.js` y entrar con `peor@prueba.test` / `vacio@prueba.test` (solo emulador).

## Verificación

Todo en el navegador de Playwright contra los emuladores (no es Safari ni un celular real). Cada barrido tiene un control negativo para comprobar que el script detecta lo que dice detectar.

| Qué | Cómo | Resultado |
|---|---|---|
| Objetivos de 44 px, scroll lateral y elementos tapados | 4 pantallas previas al ingreso (Landing, guía de instalar, ingreso, registro) y 13 estados con sesión (Inicio, hoja de gasto, cuenta nueva y editar, movimiento, confirmar eliminar, Gastos fijos, gasto fijo nuevo y editar, Reportes, tope, Perfil, confirmar salir) × 320, 393 y 1100 px × claro y oscuro, con `ana` y otra vez con `peor` | 0 objetivos menores de 44 px, 0 desbordes, 0 elementos tapados. Control: un botón de 30 px inyectado sí se marca |
| Contraste del texto (WCAG AA, calculado sobre el fondo real) | Los mismos estados a 393 px, claro y oscuro | 0 textos bajo 4,5:1 (3:1 en texto grande). Control: texto `#999` sobre blanco da 2,85 y se marca |
| Foco visible y orden de Tab | Inicio, hoja de gasto, Reportes, Perfil y confirmar salir × 393 y 1100 × claro y oscuro | Todo lo que recibe foco tiene anillo. Las hojas y los diálogos atrapan el foco. Encontrado y corregido: en 1100 px el riel quedaba al final del orden |
| Escape con diálogos apilados | Hoja de movimiento → Eliminar → Escape | Se cierra solo la confirmación; la hoja sigue abierta |
| Texto al 200 % | Tamaño de letra de la página al doble (todo el CSS usa `rem`), 320 y 393 px, claro y oscuro, los 13 estados | Encontrado: scroll lateral a 320 px en Inicio, Gastos fijos, Perfil y confirmaciones. Corregido: ahora 0 |
| Movimiento completo | Playwright con `prefers-reduced-motion: no-preference` | La hoja sube 588 → 0 px con fundido y queda en `transform: none`; los dígitos del saldo giran y se asientan; Deshacer los devuelve; el aviso aparece |
| Movimiento reducido | Mismo flujo con `reduce` | La hoja no se desplaza, solo se funde |
| Casos extremos (`break-ui`) | Usuario `peor` con los límites reales del servidor (ver abajo) | 4 roturas corregidas, 2 decisiones tuyas, el resto aguantó |
| Deuda de los `pr-*.md` | Ver abajo | Cerrada, con un hallazgo (el aviso) y dos del PDF |

Pruebas: **328 → 331** (3 nuevas: singular de "restantes", emoji en el PDF, anchos de columna del PDF). Lint 0 errores (9 avisos conocidos). Build OK; el precache pasa de 1765,23 a 1765,82 KiB.

### Casos extremos (`break-ui`)

Los datos entran por `/api`, igual que los reales, así que valen los mismos límites del servidor: nombre de cuenta 40 (el formulario permite 25), descripción de movimiento 200 (el formulario permite 30), gasto fijo 80, tope hasta 999.999.999,99. El interruptor "Demo / Peor caso" es entrar con `ana` o con `peor`; no hay nada de eso dentro de la app. También `vacio` (sin cuentas ni movimientos) para los estados vacíos. Capturas en `docs/ui-redesign/a11y/`.

| # | Gravedad | Dónde | Valor | Qué pasaba | Estado |
|---|---|---|---|---|---|
| 1 | Roto | PDF, Monto | descripción de 200 caracteres en el mismo mes | Las columnas se achicaban y el monto se partía ("$ 1.250." / "001") | Corregido: anchos fijos y monto a la derecha |
| 2 | Roto | PDF, Descripción | emoji ("Empanadas 🥟") | Salía "Ø>Ý" y se pasaba de la celda | Corregido: se quitan en el PDF |
| 3 | Roto | Movimientos | 21 movimientos | "Ver los 1 restantes" | Corregido |
| 4 | Roto | Aviso sobre hoja | reabrir "Guardar tope" con el aviso visible | El aviso cubría el botón y recibía el toque | Corregido |
| 5 | Frágil | Descripción en la hoja | 31 a 200 caracteres | El campo de texto es de un renglón: se lee desplazándolo adentro. El formulario nuevo limita a 30, el servidor acepta 200 (datos viejos, importaciones) | **En pie, decisión tuya** |
| 6 | Decisión | Montos con centavos | $ 0,50, $ 0,01, $ 99.999.999,99 | Se muestran redondeados a pesos enteros: "$ 1", "$ 0", "$ 100.000.000". La hoja de edición sí muestra los centavos | **En pie, decisión tuya** |
| 7 | Frágil | Lista de movimientos | miles de movimientos | "Ver los N restantes" dibuja todos de una vez, sin virtualizar. No lo probé con 1000 | En pie (poco realista en finanzas personales) |

Lo que aguantó: saldo de 12 cifras (se achica y queda legible), cuenta de 40 caracteres, cuenta de una letra ("X"), emoji en el nombre de una cuenta y en una descripción en pantalla, una URL de 105 caracteres sin espacios en un renglón, descripción de 200 caracteres, gasto fijo de 77 caracteres (baja a tres renglones), topes de $ 1 y de $ 999.999.999, cifras de 12 a 25 millones, vencimiento el día 31 en un gasto anual y un usuario sin nada en todas las pantallas. Los singulares "1 gasto fijo", "1 movimiento" y "1 tope superado" los revisé leyendo el código (tienen su caso), no en pantalla. Las cifras nunca se cortan: se truncan los nombres, no los montos.

### Deuda de verificación de los `pr-*.md`

| Pendiente | Resultado |
|---|---|
| "Reenviar correo" en el navegador | Sin contraseña escrita avisa "Ingresá tu contraseña." y no envía. Con correo y contraseña envía (el emulador pasa de 1 a 2 correos) y muestra "Te reenviamos el correo de verificación." |
| Error "sin conexión" real | Con la red cortada, "Ingresar" muestra "Sin conexión. Revisá internet y probá de nuevo." |
| "Crear una cuenta" desde Gastos fijos con un usuario sin cuentas | Abre "Nueva cuenta"; al guardar vuelve a Gastos fijos con el aviso "Cuenta creada". La hoja del gasto fijo no se reabre sola: hay que tocar "Nuevo gasto fijo" otra vez |
| Aviso que tapa "Guardar tope" | Reproducido y corregido |
| PDF mirado renderizado | Mirado en imagen. Encontré y corregí 2 problemas (arriba) |
| Escritorio en las pantallas previas al ingreso | Capturas a 1100 px, claro y oscuro: columna centrada de 400 px, sin problemas |
| ErrorBoundary en el navegador | Forzando un error de formato: aparece "Algo salió mal" con `role="alert"` y "Recargar" vuelve a la app |
| `break-ui` | Corrido de verdad (arriba) |

## No probado / límites

- **Safari, iPhone y Android reales, lector de pantalla, abrir el CSV en Excel.** Todo lo anterior es Chrome emulado.
- **La guía de instalar** sigue sin seguirse en un iPhone ni un Android reales (los nombres de las opciones cambian entre versiones).
- El contraste se midió en **texto**; no se midieron íconos, bordes ni el anillo de foco contra el fondo.
- Zoom del 200 % emulado con el tamaño de letra de la página, no con el zoom del navegador ni con el tamaño de fuente del sistema.
- No se probó RTL, modo de alto contraste forzado ni 1000 filas.
- Quedan transiciones de color y sombra (`box-shadow` de la tecla, `background-color`, `border-color`) además de `transform` y `opacity`: son de color o relieve, no de movimiento, y se dejaron.
- Los `style` con valores calculados (`Dither`, `Odometer`, medidores) siguen siendo inline a propósito.
- El aviso, mientras hay una hoja abierta, se oculta (no se descarta): si traía "Deshacer", se puede usar al cerrar la hoja si todavía no venció.
- El detector de impeccable corrió después de cada edición de UI y no marcó nada.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
