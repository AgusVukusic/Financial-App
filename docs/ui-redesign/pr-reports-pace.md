# Termómetro de ritmo en Reportes (decisión 8)

## Qué cambia en producción

- **Reportes muestra una tarjeta "Ritmo del mes"** arriba de la lista de topes: cuánto llevás gastado en las categorías que tienen tope contra cuánto correspondería a esta altura del mes.
  - Esperado = suma de los topes × (día de hoy ÷ días del mes). Gastado = lo gastado en las categorías con tope (las 6 fijas).
  - El estado va en palabras con ícono y medidor: **"Vas más rápido de lo esperado"** (más del 10 % por encima; único caso en `--warn`), **"En ritmo"** (dentro de ±10 %) o **"Vas más lento de lo esperado"** (más del 10 % por debajo). Debajo, las dos cifras ("Llevás gastado" y "Corresponde al día N") y una nota: "Cuenta solo las categorías que tienen tope".
  - Solo aparece en el **mes en curso**, con **al menos un tope cargado** y **desde el día 4** del mes. En otros meses, sin topes o los días 1 a 3, no se ve (nada queda vacío ni roto).
- **Dónde va y por qué:** dentro de "00 Topes del mes", encima de las categorías, y no como sección numerada nueva. Es la lectura resumida de esos mismos topes; una sección nueva habría renumerado "En qué se fue" y "Últimos 6 meses" y puesto el resumen debajo de la lista que resume. Arriba de todo ya está la línea de alertas ("2 topes superados"), que habla de categorías sueltas.
- No cambia nada en el servidor, en las reglas, en los hooks ni en los datos guardados.

## Antes / después

- Antes: `docs/ui-redesign/reports/01-topes-oscuro.jpg` (sin tarjeta).
- Después, `ana` (393 px, claro): `docs/ui-redesign/reports-pace/01-ana-pantalla-claro-393.png` (pantalla entera en tema claro: alertas, tarjeta y primeros topes), `ana-light-393-z100.png`.
- "En ritmo" (reloj fijado al 28 de noviembre): `ana-en-ritmo-oscuro-393.png`.
- Peor caso: `peor-dark-320-z200.png` (320 px, texto al 200 %), `peor-light-1100-z100.png` (escritorio).

## Cómo probarlo

1. Emuladores + `node scripts/seed-emulators.js` → `ana@prueba.test` → Reportes: "Vas más rápido de lo esperado" ($ 970.710 gastado contra $ 522.667 al día 16).
2. `peor@prueba.test` (topes de $ 1 y de $ 999.999.999): "Vas más lento de lo esperado".
3. Mes anterior en el selector, o `vacio@prueba.test`: la tarjeta no aparece.

## Decisiones de diseño mías (a validar por el usuario)

La propuesta aprobada ("perfecto") no fijaba estos dos números; los elegí yo y cambiarlos es tocar una constante en `src/utils/reportsData.js`:

- **Desde el día 4** (`PACE_FIRST_DAY`). Los primeros días un solo gasto grande (el alquiler el día 1) dispara "más rápido" con un esperado de 1/30 de los topes. Desde el 4 ya hay algo de base.
- **Tolerancia de ±10 %** para "En ritmo". Sin banda, cualquier peso de diferencia cambiaría el mensaje todos los días.
- El medidor compara lo gastado con lo esperado. En "En ritmo" se limita a lleno (si no, mostraría el segmento rayado de exceso mientras el texto dice que vas bien); solo "más rápido" lo muestra.

## Verificación

- Lint 0 errores (9 avisos conocidos). Pruebas: **390 → 405** (15 nuevas: 10 de `paceStatus` en `reportsData.test.js` y 5 de la tarjeta en `reports.test.jsx`). Build OK.
- Las pruebas cubren: cuenta esperado/gastado, bordes exactos de ±10 %, categorías sin tope o con tope 0, gasto negativo y valores raros, centavos, febrero de 2028 (29 días), último día del mes, otro mes/año, sin topes y días 1 a 3.
- Navegador (Playwright contra emuladores), usuarios `ana` y `peor`, a 320, 393 y 1100 px, claro y oscuro, texto al 100 % y 200 %: sin scroll horizontal (`scrollWidth` ≤ `innerWidth` en las 24 combinaciones), ningún elemento de la tarjeta con contenido recortado, cifras de `peor` ($ 234.052.414 y $ 534.037.334) enteras a 320 px con texto al 200 %. Estados vistos en pantalla: "más rápido" (`ana`), "más lento" (`peor`) y "en ritmo" (`ana` con el reloj en el día 28). Mes anterior y `vacio`: sin tarjeta.
- Detector de diseño de impeccable: 0 avisos en `PaceCard.jsx` y su CSS.

## No probado / límites

- Los días 1 a 3 (tarjeta oculta) solo se probaron con pruebas unitarias y de componente, no en el navegador.
- No se probó con "reducir movimiento" ni con movimiento completo: la tarjeta no anima nada.
- El día se calcula al dibujar la pantalla; si la app queda abierta pasada la medianoche, no se actualiza hasta que algo vuelva a dibujarla.
- Puede leerse como contradictorio que arriba diga "2 topes superados" y la tarjeta "Vas más lento" (pasa con `peor`): una habla de categorías sueltas y la otra del total con topes.
- La suma de topes incluye solo las 6 categorías fijas; un tope guardado con otra categoría no se ve en pantalla y tampoco cuenta.
- Safari, iPhone real y lector de pantalla (el medidor trae `role="meter"` con el estado en `aria-valuetext`; no lo oí).
