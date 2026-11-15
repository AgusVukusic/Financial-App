# Cierre del rediseño: documentación y un último arreglo (fase 5, unidad D)

## Qué cambia en producción

- **Los montos ya no se cortan a 320 px** (hueco que quedó de la unidad B, detectado al documentar la regla "las cifras nunca se cortan"):
  - En "Anotar rápido", la cifra de cada tecla se achica según su largo (los montos normales siguen en 12 px; uno de 8 cifras baja a 10,7 px). Antes "$ 25.000.000" salía como "$ 25.000…".
  - En "Cuentas", un saldo muy largo baja de renglón en vez de cortarse. En 393 px y escritorio nada cambia.
- Todo lo demás es documentación; no cambia lo que ve la gente.

## Qué se agrega

- **`DESIGN.md`** (raíz): el sistema visual para herramientas y agentes. Frontmatter con 22 colores (claro y oscuro), 7 tipografías, radios, espaciado y 10 componentes; las ocho secciones canónicas; reglas con nombre (Only-Touchable, Never-Color-Alone, AA, Tabular, Press, Hard-Edge…) y "Do / Don't" grounded en lo que ya está en producción. Nombre de la dirección: **Panel de taller** (la que elegiste). Se verificó que sus 32 referencias `{grupo.token}` resuelvan.
- **`.impeccable/design.json`** (sidecar con rampas tonales, sombras, movimiento y 10 componentes en HTML/CSS). Queda sin commitear, como el resto de `.impeccable/`.
- **`CLAUDE.md`**: la sección de UI ahora lista las reglas de todas las pantallas, los primitivos de `components/ui/`, dónde está cada pantalla, el título de pestaña, las utilidades nuevas, cómo probar la UI (seeds `ana`, `peor`, `vacio`; 320/393/1100 px; texto al 200 %; movimiento completo y reducido) y la PWA (incluida la trampa de probar sin conexión contra un build). Los avisos de lint son 9, no 12.
- **`design-system.md`**: apunta a `DESIGN.md`, corrige los alias (quedan 13 y solo los lee Grupos), el aviso con hojas abiertas y las reglas de texto grande; reemplaza "Lo que queda para las pantallas" por el estado real.
- **`handoff.md` y `progress.md`** al día: el rediseño figura como terminado.

## Cómo probarlo

1. `npm ci && npm run lint && npm test && npm run build`.
2. Entrar con `peor@prueba.test` (ver `scripts/seed-worstcase.js`) a 320 px: los frecuentes y las cuentas muestran sus cifras completas.
3. Leer `DESIGN.md` y compararlo con `src/styles/tokens.css`: los valores coinciden.

## Verificación

- Medido en el navegador (Playwright) con el usuario `peor`. Antes del arreglo, un barrido de montos en Inicio, Gastos fijos, Reportes y Perfil a 320 y 393 px, claro y oscuro, solo encontró cortes en 2 saldos de cuentas y 1 frecuente (a 320 px). Después, Inicio a 320, 393 y 1100 px (claro y oscuro) da 0 montos cortados, y los frecuentes también con texto al 200 % a 320 px. Gastos fijos, Reportes y Perfil no se volvieron a barrer porque no se tocaron.
- Lint 0 errores (9 avisos conocidos). Pruebas: **331**, sin cambios. Build OK.
- `DESIGN.md`: frontmatter sin tabulaciones y con todas las referencias resueltas (revisión con un script propio, no con el validador de Stitch).

## No probado / límites

- **Aparatos reales**: iPhone, Android, Safari, lector de pantalla, abrir el CSV en Excel y seguir la guía de instalación (Landing) en un iPhone y un Android reales. Esto sigue pendiente de vos.
- **`DESIGN.md`**: no pasé las preguntas de creatividad de `/impeccable document` (nombre de la dirección, voz): usé la dirección que ya aprobaste y el lenguaje de `design-system.md`. Si querés ajustar algo de la voz o los nombres, se edita ahí.
- El validador oficial del formato `DESIGN.md` no se corrió (no está instalado).
- El saldo de una cuenta que baja de renglón a 320 px hace esa fila más alta (87 a 95 px en lugar de 60).

## Lo que queda abierto (no lo resolví por mi cuenta)

Las preguntas 3 a 8 de `handoff.md` §12:
3. ¿Unificar las categorías de Gastos fijos con las 6 de la app? Hoy esos pagos quedan fuera de los topes y caen en "Otros" en Reportes.
4. ¿CSV con `;` y coma decimal para Excel en español? Hoy usa coma y punto.
5. ¿Ampliar los frecuentes a los últimos meses? (necesita un dato nuevo de la capa de datos).
6. ¿Entrada por texto natural ("café 3500") en Anotar?
7. ¿Grilla de dos columnas en escritorio (≥ 1024 px)?
8. ¿"Termómetro de ritmo" en Reportes (gastado vs. esperado a la fecha)?

🤖 Generated with [Claude Code](https://claude.com/claude-code)
