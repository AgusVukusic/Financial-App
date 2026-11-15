# Accesibilidad, movimiento y casos extremos (fase 5, unidad B)

## Qué cambia en producción

- **Con el texto grande (200 %) no se ensancha la pantalla ni se pisa nada.** Con las cifras de un usuario "de peor caso" a 320 px:
  - El saldo (15 cifras) y el gasto mensual de Gastos fijos se achican hasta entrar (antes pasaban de 320 a 353 y 325 px de ancho).
  - Las etiquetas ("VENCIÓ HACE 3 DÍAS"), el encabezado de Gastos fijos y los botones de los diálogos bajan de renglón.
  - Los frecuentes de "Anotar rápido" pasan a una columna (el monto se mostraba cortado: "$ 1…"). Entró y Salió se apilan (la cifra se partía en medio: "987 / .654.3 / 22").
  - Los rótulos de la barra inferior dejan de pisarse: no crecen más allá de 3,4 % del ancho (a 320 px son 10,9 px, contra 11 px antes). A 100 % se ven igual.
- **Con teclado, en escritorio, el riel de la izquierda es lo primero que alcanza Tab** (antes era lo último). Contrapartida: en el celular la barra inferior también queda antes del contenido en el orden de Tab y de lectura (después de "Saltar al contenido").
- **El aviso ("Listo: …") ya no tapa el botón de abajo de una hoja.** Pasaba al volver a abrir una hoja con el aviso todavía visible (por ejemplo "Guardar tope"): el aviso quedaba encima y se llevaba el toque. Ahora, con una hoja o un diálogo abierto, los avisos de éxito se ocultan (vuelven al cerrarla) y los de error suben arriba, para que nunca se pierdan ni tapen el botón.
- **"Ver el movimiento restante"** cuando queda uno solo por mostrar (antes decía "Ver los 1 restantes").
- **PDF de movimientos:** los montos ya no se parten en dos renglones cuando hay una descripción larga ("$ 1.250." / "001"), la fecha entra en un solo renglón y se quitan los caracteres que el PDF no puede escribir (emoji, flechas, ✓, ≥: salían como basura, "Ø>Ý"). Se conservan las comillas y rayas tipográficas del teclado del iPhone, €, ©, ®, ™, ¿ y ¡. El CSV conserva todo.
- Solo desarrollo: `scripts/seed-worstcase.js` carga los datos de peor caso en los emuladores. No se publica nada.

## Antes / después

"Antes" se midió, no se capturó (salvo el aviso): ancho de página a 320 px con texto al 200 % y datos de peor caso, Inicio 353 px y Gastos fijos 325 px (el límite es 320). Después: 316 px en las dos, y también en Reportes, Perfil y la hoja de movimiento, en claro y oscuro.

- Antes, aviso sobre "Guardar tope": `a11y/antes-toast-sobre-guardar-tope-claro-393.png`
- Después, hoja con el botón libre: `a11y/despues-toast-oculto-con-hoja-claro-393.png`
- Después, Inicio a 320 px con texto al 200 %: `a11y/despues-inicio-texto200-claro-320.png` y `a11y/despues-inicio-frecuentes-texto200-claro-320.png`
- Después, Gastos fijos a 320 px con texto al 200 %: `a11y/despues-gastos-fijos-texto200-claro-320.png`

## Cómo probarlo

1. `npm ci && npm run lint && npm test && npm run build`.
2. Texto grande: en el celular, Ajustes → Pantalla → Tamaño de la fuente al máximo, y mirar Inicio y Gastos fijos (o en el navegador de escritorio, zoom al 200 %). No debe haber desplazamiento lateral ni rótulos pisados.
3. Aviso: Reportes → tocar un tope → Guardar tope → tocarlo de nuevo enseguida: el botón "Guardar tope" tiene que responder.
4. PDF: Perfil → Exportar PDF con una descripción larga y otra con emoji.
5. Peor caso (local): `npm run emulators`, `npm run dev:api`, `node scripts/seed-worstcase.js` y entrar con `peor@prueba.test` / `vacio@prueba.test` (solo emulador).

## Verificación

Todo en el navegador de Playwright contra los emuladores (no es Safari ni un celular real). Los barridos llevaron un control negativo para comprobar que el script detecta lo que dice detectar.

| Qué | Cómo | Resultado |
|---|---|---|
| Objetivos de 44 px, scroll lateral y elementos tapados | 4 pantallas previas al ingreso (Landing, guía de instalar, ingreso, registro) y 13 estados con sesión (Inicio, hoja de gasto, cuenta nueva y editar, movimiento, confirmar eliminar, Gastos fijos, gasto fijo nuevo y editar, Reportes, tope, Perfil, confirmar salir) × 320, 393 y 1100 px × claro y oscuro, con `ana` y otra vez con `peor` (antes de los últimos cambios de CSS) | 0 objetivos menores de 44 px, 0 desbordes, 0 elementos tapados. Control: un botón de 30 px inyectado sí se marca |
| Contraste del texto (WCAG AA, calculado sobre el fondo real) | Barrido completo con `ana` a 393 px, claro y oscuro. Repetido con `peor` en Inicio, Gastos fijos, Reportes, Perfil y la hoja de gasto, esta vez **incluyendo el texto `aria-hidden`** (numerales "00", "$"): 240 elementos de texto solo en Inicio | 0 textos bajo 4,5:1 (3:1 en texto grande). Control: texto `#999` sobre blanco da 2,85 y se marca |
| Foco visible y orden de Tab | Inicio, hoja de gasto, Reportes, Perfil, Gastos fijos y confirmar salir, claro y oscuro (393 y 1100 en la primera pasada) | Botones y enlaces: contorno de 2 px de acento. Campos y listas desplegables: anillo de 2 px de acento (`box-shadow`, sin contorno); rojo-naranja `#BF3F0A` en claro y `#FF6B1A` en oscuro sobre el fondo. Las hojas y los diálogos atrapan el foco. Encontrado y corregido: en 1100 px el riel quedaba al final del orden |
| Escape con diálogos apilados | Hoja de movimiento → Eliminar → Escape | Se cierra solo la confirmación; la hoja sigue abierta |
| Texto al 200 % | Tamaño de letra de la página al doble (todo el CSS usa `rem`), 320 y 393 px, claro y oscuro. Primero con `ana`: scroll lateral a 320 px en Inicio, Gastos fijos, Perfil y confirmaciones (corregido). Después con `peor`, que mostró 3 problemas más que `ana` no mostraba (saldo y gasto mensual de 15 cifras, frecuentes cortados, rótulos de la barra pisados, Entró/Salió partidos) | Corregidos. Ancho de página ≤ 320 px en Inicio, hoja de movimiento, Gastos fijos, Reportes y Perfil |
| Avisos | Aviso de éxito con hoja abierta; error sin conexión dentro de la hoja de gasto; Deshacer de "Anotar rápido" y de pagar un gasto fijo | El botón de la hoja queda libre; el error aparece arriba (opacidad 1) y la hoja sigue abierta; los Deshacer se ven y funcionan; al cerrar no queda ningún diálogo montado |
| Etiquetas y diálogos a 100 % | Etiquetas de estado de Inicio, Reportes, Perfil y Gastos fijos × 320/393 × claro/oscuro; botones de la confirmación de salir | Ninguna etiqueta en dos renglones; los dos botones miden lo mismo (112/112 a 320 px, 149/149 a 393) |
| Movimiento completo | Playwright con `prefers-reduced-motion: no-preference` | La hoja sube 588 → 0 px con fundido y queda en `transform: none`; los dígitos del saldo giran y se asientan; Deshacer los devuelve; el aviso aparece |
| Movimiento reducido | Mismo flujo con `reduce` | La hoja no se desplaza, solo se funde |
| Casos extremos (`break-ui`) | Usuario `peor` con los límites reales del servidor (ver abajo) | 8 roturas corregidas, 2 decisiones tuyas, el resto aguantó |
| Deuda de los `pr-*.md` | Ver abajo | Cerrada, con un hallazgo (el aviso) y varios del PDF |

Pruebas: **328 → 331** (3 nuevas: singular de "restantes", caracteres del PDF, anchos de columna del PDF). Lint 0 errores (9 avisos conocidos). Build OK; el precache pasa de 1765,23 a 1766,21 KiB.

### Casos extremos (`break-ui`)

Los datos entran por `/api`, igual que los reales, así que valen los mismos límites del servidor: nombre de cuenta 40 (el formulario permite 25), descripción de movimiento 200 (el formulario permite 30), gasto fijo 80, tope hasta 999.999.999,99. El interruptor "Demo / Peor caso" es entrar con `ana` o con `peor`; no hay nada de eso dentro de la app. También `vacio` (sin cuentas ni movimientos) para los estados vacíos. Capturas en `docs/ui-redesign/a11y/`.

| # | Gravedad | Dónde | Valor | Qué pasaba | Estado |
|---|---|---|---|---|---|
| 1 | Roto | PDF, Monto | descripción de 200 caracteres en el mismo mes | Las columnas se achicaban y el monto se partía ("$ 1.250." / "001") | Corregido: anchos fijos y monto a la derecha |
| 2 | Roto | PDF, Descripción | emoji, ≥, →, ✓ | Salían como basura ("Ø>Ý") y se pasaban de la celda | Corregido: se quitan; lo que Helvetica sí escribe se conserva (revisado con comillas, rayas, €, ©, ®, ™ del iPhone) |
| 3 | Roto | Movimientos | 21 movimientos | "Ver los 1 restantes" | Corregido |
| 4 | Roto | Aviso sobre hoja | reabrir "Guardar tope" con el aviso visible | El aviso cubría el botón y recibía el toque | Corregido (éxito oculto, errores arriba) |
| 5 | Roto | Anotar rápido, 200 % | monto de 8 cifras | "$ 1…" cortado | Corregido: una columna con texto grande |
| 6 | Feo | Barra inferior, 200 % | texto grande | Los rótulos se pisaban | Corregido: tope de tamaño |
| 7 | Feo | Entró / Salió, 200 % | "+$ 987.654.322" | La cifra se partía en medio | Corregido: se apilan |
| 8 | Roto | Saldo y gasto mensual, 200 % | 15 cifras | Ensanchaban la pantalla (353 y 325 px) | Corregido |
| 9 | Frágil | Descripción en la hoja | 31 a 200 caracteres | El campo de texto es de un renglón: se lee desplazándolo adentro. El formulario nuevo limita a 30, el servidor acepta 200 (datos viejos, importaciones) | **En pie, decisión tuya** |
| 10 | Decisión | Montos con centavos | $ 0,50, $ 0,01, $ 99.999.999,99 | Se muestran redondeados a pesos enteros: "$ 1", "$ 0", "$ 100.000.000". La hoja de edición sí muestra los centavos | **En pie, decisión tuya** |
| 11 | Frágil | Lista de movimientos | miles de movimientos | "Ver los N restantes" dibuja todos de una vez, sin virtualizar. No lo probé con 1000 | En pie (poco realista en finanzas personales) |

Lo que aguantó: saldo de 12 cifras a 100 %, cuenta de 40 caracteres, cuenta de una letra ("X"), emoji en el nombre de una cuenta y en una descripción en pantalla, una URL de 105 caracteres sin espacios en un renglón, descripción de 200 caracteres, gasto fijo de 77 caracteres (baja a tres renglones), topes de $ 1 y de $ 999.999.999, cifras de 12 a 25 millones, vencimiento el día 31 en un gasto anual y un usuario sin nada en todas las pantallas. Los singulares "1 gasto fijo", "1 movimiento" y "1 tope superado" los revisé leyendo el código (tienen su caso), no en pantalla. Las cifras nunca se cortan: se truncan los nombres, no los montos.

### Deuda de verificación de los `pr-*.md`

| Pendiente | Resultado |
|---|---|
| "Reenviar correo" en el navegador | Sin contraseña escrita avisa "Ingresá tu contraseña." y no envía. Con correo y contraseña envía (el emulador pasa de 1 a 2 correos) y muestra "Te reenviamos el correo de verificación." |
| Error "sin conexión" real | Con la red cortada, "Ingresar" muestra "Sin conexión. Revisá internet y probá de nuevo." |
| "Crear una cuenta" desde Gastos fijos con un usuario sin cuentas | Abre "Nueva cuenta"; al guardar vuelve a Gastos fijos con el aviso "Cuenta creada". La hoja del gasto fijo no se reabre sola: hay que tocar "Nuevo gasto fijo" otra vez |
| Aviso que tapa "Guardar tope" | Reproducido y corregido |
| PDF mirado renderizado | Mirado en imagen varias veces. Encontré y corregí los problemas 1 y 2 de arriba |
| Escritorio en las pantallas previas al ingreso | Capturas a 1100 px, claro y oscuro: columna centrada de 400 px, sin problemas |
| ErrorBoundary en el navegador | Forzando un error de formato: aparece "Algo salió mal" con `role="alert"` y "Recargar" vuelve a la app |
| `break-ui` | Corrido de verdad (arriba) |

## No probado / límites

- **Safari, iPhone y Android reales, lector de pantalla, abrir el CSV en Excel.** Todo lo anterior es Chrome emulado.
- **La guía de instalar** sigue sin seguirse en un iPhone ni un Android reales (los nombres de las opciones cambian entre versiones).
- El contraste se midió en **texto**; no se midieron íconos, bordes ni el anillo de foco contra el fondo (el anillo de los campos se comparó a ojo con sus colores, no se calculó).
- El barrido de objetivos de 44 px, scroll y tapados se corrió **antes** de los últimos cambios de CSS (frecuentes, Entró/Salió, barra, cifras): después se revisó solo el ancho de página y las capturas, no se repitió el barrido completo.
- Zoom del 200 % emulado con el tamaño de letra de la página, no con el zoom del navegador ni con el tamaño de fuente del sistema. Con texto al 200 % los rótulos de la barra inferior **no crecen** (se limitan a 3,4 % del ancho para no pisarse) y los frecuentes pasan a una columna.
- No se probó RTL, modo de alto contraste forzado ni 1000 filas.
- Quedan transiciones de color y sombra (`box-shadow` de la tecla, `background-color`, `border-color`) además de `transform` y `opacity`: son de color o relieve, no de movimiento, y se dejaron.
- Los `style` con valores calculados (`Dither`, `Odometer`, medidores) siguen siendo inline a propósito.
- El aviso de éxito, mientras hay una hoja abierta, se oculta (no se descarta): si traía "Deshacer", se puede usar al cerrar la hoja si todavía no venció. Usa `:has()` (Chrome 105, Safari 15.4, Firefox 121); en un navegador más viejo el aviso se vería como antes.
- El detector de impeccable corrió después de cada edición de UI y no marcó nada.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
