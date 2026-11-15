---
name: Finanzas Personales
description: Panel de taller para las finanzas de todos los días: teclas con relieve, rótulos de instrumento y un solo naranja para lo que se puede tocar.
colors:
  panel: "#131311"
  panel-surface: "#1f1e1b"
  panel-chip: "#2c2a26"
  panel-ink: "#f2efe7"
  panel-ink-muted: "#a9a497"
  panel-rule: "#3c3a35"
  orange: "#ff6b1a"
  on-orange: "#1b0a00"
  entered-green: "#5ed38a"
  alert-rose: "#ff8aa6"
  warning-amber: "#f0c24b"
  paper: "#efece2"
  paper-surface: "#fbfaf5"
  paper-chip: "#e3dece"
  paper-ink: "#1a1916"
  paper-ink-muted: "#58544a"
  paper-rule: "#c9c3b3"
  orange-on-paper: "#bf3f0a"
  on-orange-on-paper: "#ffffff"
  entered-green-on-paper: "#1b6b32"
  alert-rose-on-paper: "#b0123c"
  warning-amber-on-paper: "#7e5006"
typography:
  display:
    fontFamily: "Doto, Geist Mono, ui-monospace, monospace"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.2
  figure:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  title:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  lead:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
  small:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  xs: "3px"
  sm: "4px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "48px"
  button-primary-large:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    typography: "{typography.lead}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "56px"
  button-key:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.panel-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.panel-ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  chip:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.panel-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.panel-ink}"
    textColor: "{colors.panel}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.panel-ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.panel-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "48px"
  card:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.panel-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  sheet:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.panel-ink}"
    rounded: "16px 16px 0 0"
    padding: "0 16px 16px"
---

# Design System: Finanzas Personales

## Overview

**Creative North Star: "Panel de taller"**

Una app de plata que se siente como el tablero de un instrumento bien hecho, no como una app de banco. Teclas con relieve que se hunden al apretarlas, rótulos chicos en mayúsculas monoespaciadas como los de un panel de control, cifras grandes dibujadas con puntos y un único color vivo, el naranja, que significa una sola cosa: *esto se puede tocar*. Todo lo demás es tinta sobre superficie: negro tibio de taller de noche o papel de taller de día, con el mismo peso en los dos.

Es una herramienta de uso rápido y con una mano: registrar un gasto en la calle, mirar el saldo, pagar un vencimiento. Por eso la densidad es media y la jerarquía fuerte: el saldo manda en la primera pantalla, las acciones frecuentes son teclas grandes, y las listas son renglones de un solo botón. La personalidad está en los detalles (el relieve, los puntos, las tramas), no en adornos.

Se rechaza explícitamente lo que tenía antes: degradé índigo a violeta, paneles de vidrio con desenfoque, resplandores, bordes laterales de color en las tarjetas y emoji como marca.

**Key Characteristics:**
- Teclas con relieve duro (sin desenfoque) que se hunden 3 px al apretarlas.
- Un solo acento, el naranja, y solo para lo accionable. Nunca marca un estado.
- Estado siempre en texto + ícono (+ forma); nunca solo por color.
- Cifras en monoespaciada tabular; la cifra protagonista de cada pantalla en Doto (puntos) con el "$" en naranja.
- Tramas en tinta (puntos, rayas, sólido) para distinguir categorías sin depender del color.
- Oscuro y claro valen lo mismo; el tema sigue al sistema hasta que la persona elige.
- Objetivos táctiles de 44 px o más; 56 px para las acciones principales.

## Colors

Una paleta de tinta y papel con un solo golpe de color. Dos temas con los mismos roles; cada uno con su propio naranja y sus propios colores de estado, ajustados para pasar AA sobre sus fondos.

### Primary
- **Naranja de taller** (#ff6b1a oscuro / #bf3f0a claro): la única señal de "se puede tocar". Botón principal, numerales de sección (00, 01, 02…), indicador de la pestaña actual, anillo de foco de los campos, el "$" de las cifras en Doto. En claro es un naranja quemado para sostener el contraste. Texto sobre naranja: #1b0a00 (oscuro) o blanco (claro).

### Secondary (estado, nunca acento)
- **Verde de entrada** (#5ed38a oscuro / #1b6b32 claro): dinero que entró. Siempre con signo "+".
- **Rosa de alerta** (#ff8aa6 oscuro / #b0123c claro): vencido, tope superado, error. Siempre con ícono y palabra.
- **Ámbar de aviso** (#f0c24b oscuro / #7e5006 claro): cerca del límite. Siempre con ícono y palabra.

### Neutral
- **Panel** (#131311) y **Papel de taller** (#efece2): fondo de pantalla.
- **Superficie** (#1f1e1b / #fbfaf5): tarjetas, hojas, teclas.
- **Chip** (#2c2a26 / #e3dece): fondo de elementos secundarios y de pulsación.
- **Tinta** (#f2efe7 / #1a1916): texto principal y bordes que identifican un control.
- **Tinta suave** (#a9a497 / #58544a): texto secundario y bordes de controles.
- **Filete** (#3c3a35 / #c9c3b3): líneas decorativas; no sirven como único borde de un control (contraste 1,5:1).

### Named Rules
**The Only-Touchable Rule.** El naranja se usa para lo que se puede tocar y nada más. Si algo es naranja y no responde al toque, está mal. Un estado nunca usa naranja.

**The Never-Color-Alone Rule.** Entró, gasto, vencido, superado y cerca del límite se distinguen por signo, ícono, palabra o forma. El gasto va en tinta neutra con "−"; el ingreso, con "+" y verde.

**The AA Rule.** Todo texto llega a 4,5:1 (3:1 el grande) en los dos temas. El naranja como texto sobre el chip en claro no pasa (3,97:1): no se usa así.

## Typography

**Display Font:** Doto (con Geist Mono de respaldo), solo para cifras protagonistas de 48 px o más.
**Body Font:** Hanken Grotesk (con la fuente del sistema de respaldo).
**Label/Mono Font:** Geist Mono, para rótulos de panel y todas las cifras.

**Character:** Una grotesca humana y legible para leer, una monoespaciada de instrumento para etiquetar y medir, y una fuente de puntos para lo que hay que ver de lejos. Las tres juntas son el tablero.

### Hierarchy
- **Display** (Doto 700, 3 rem / 48 px, 1,2): el saldo total del Inicio y el gasto mensual estimado de Gastos fijos, con el "$" en naranja. Se achica para entrar en el ancho y pasa a Geist Mono desde los 12 caracteres.
- **Figure** (Geist Mono 600, 1,5 rem / 24 px, tabular): cifras destacadas.
- **Title** (Hanken Grotesk 700, 1,25 rem / 20 px, 1,2): títulos de pantalla y de hoja.
- **Lead** (Hanken Grotesk 600, 1,0625 rem / 17 px): texto de botones grandes y énfasis.
- **Body** (Hanken Grotesk 400–600, 0,9375 rem / 15 px, 1,4): lectura, campos (16 px en los campos para evitar el zoom de iOS), botones.
- **Small** (Hanken Grotesk, 0,8125 rem / 13 px): ayudas y datos secundarios.
- **Label** (Geist Mono 600, 0,6875 rem / 11 px, +0,08 em, MAYÚSCULAS): rótulos de panel, encabezados de sección, etiquetas de estado, pestañas.

### Named Rules
**The Tabular Rule.** Todo número se compone en monoespaciada tabular, para que las columnas y los cambios no bailen. La única excepción es la cifra protagonista, que va en Doto.

**The Lowercase-Title Rule.** Los títulos van en minúscula normal; solo los rótulos mono van en mayúsculas.

## Layout

Una columna pensada para el celular y una mano. Margen lateral de 16 px (24 px arriba), con respeto del área segura; la barra de navegación inferior es de 76 px y está anclada al borde (nunca flota sobre el contenido). A partir de 768 px la barra pasa a un riel lateral de 96 px y el contenido queda en una columna de 880 px; los avisos bajan al borde. Espaciado de base 4 px (4, 8, 12, 16, 24, 32, 48).

Las secciones se numeran (00, 01, 02…) con un filete debajo; las listas son renglones de un solo botón de 56 a 74 px; los estados vacíos explican y ofrecen la acción. Las grillas se adaptan al tamaño del texto: los frecuentes van de a 3 y bajan a 1 columna con el texto al 200 %; Entró y Salió se apilan. Con el texto grande nada ensancha la pantalla: lo que no entra baja de renglón, y las cifras nunca se cortan (se acortan los nombres).

Orden de lectura: la navegación va antes del contenido (el riel de escritorio es lo primero que alcanza Tab), después de "Saltar al contenido".

## Elevation & Depth

Plano por defecto y tonal: la profundidad sale de la superficie (panel → superficie → chip), de los filetes y de un relieve duro, no de sombras difusas. Las teclas llevan un reborde sólido de 3 px debajo (sin desenfoque) y se hunden al apretar. Las hojas se separan del fondo con un filete superior de 2 px en tinta y un velo negro al 55 %. El aviso (toast) es la única sombra suave y va con los colores invertidos.

### Shadow Vocabulary
- **Relieve de tecla** (`box-shadow: 0 3px 0 <borde de la tecla>`): botones primario, tecla, peligro y éxito; el borde usa la tinta o el color de estado propio de la tecla. Al apretar: `translateY(3px)` y sombra `0 0 0`.
- **Aviso** (`box-shadow: 0 8px 24px rgb(0 0 0 / 0.3)`): solo los avisos.
- **Anillo de foco de campos** (`box-shadow: 0 0 0 2px <naranja>`): campos de texto y listas desplegables.

### Named Rules
**The Press Rule.** Las teclas se hunden, no se agrandan ni brillan: relieve duro de 3 px que desaparece al apretar.

**The Hard-Edge Rule.** Ninguna sombra difusa ni resplandor, salvo el aviso. Nada de vidrio ni desenfoque de fondo.

## Shapes

Esquinas moderadas (8 a 12 px) en controles y tarjetas; chips en píldora; hojas con 16 px arriba. Los rótulos y etiquetas usan esquinas de 3 a 4 px, como una chapa. Bordes de 1 px para controles y de 2 px para lo que debe imponerse (campo de monto, filete de la hoja, filete de sección). Hay dos formas de dar textura sin color: la trama de puntos finos (tarjetas de cifras) y las tramas en tinta de las categorías (puntos finos, puntos gruesos, diagonal, vertical, horizontal, sólido).

## Components

### Buttons
Teclas con relieve. **Shape:** esquina de 10 px (`{rounded.lg}`), borde de 1 px en tinta suave, alto mínimo de 44 px (48 por defecto, 56 en acciones principales).
- **Primary:** naranja con texto de `on-orange`, borde en tinta y reborde de 3 px en tinta. Una por pantalla o por hoja.
- **Key:** superficie con tinta; la tecla de todos los días (cerrar, cancelar, acciones secundarias).
- **Danger / Success:** superficie con borde, texto y reborde del color de estado (rosa / verde). Danger solo para borrar o anular.
- **Outline / Ghost:** sin relieve; el ghost sin borde. Con puntero, fondo chip al pasar.
- **Disabled:** 55 % de opacidad. **Focus:** contorno de 2 px de acento con 2 px de separación.

### Chips
Píldora de 44 px con borde de tinta suave. Seleccionado: fondo tinta, texto del color del panel y tilde "✓" (no solo color). Se usan para categorías, cuentas y los frecuentes de "Anotar rápido".

### Tags
Chapa de 11 px mono en mayúsculas con borde de 1 px, esquina de 4 px. Variantes: neutral, accent, dashed, ok (verde), warn (ámbar), bad (rosa). Siempre con texto; las de alerta, con ícono.

### Cards / Containers
**Corner Style:** 10 px. **Background:** superficie con filete de 1 px; variantes punteada (trama de puntos) y de borde discontinuo (vacío). **Padding:** 16 px. Sin sombra.

### Inputs / Fields
Alto de 48 px, esquina de 10 px, fondo del panel, borde de 1 px en tinta suave, 16 px de fuente. **Focus:** borde en tinta y anillo de 2 px de acento. **Error:** borde del color de alerta + ícono y texto asociados con `aria-describedby`. La etiqueta, la ayuda y el error van conectados al control.

### Navigation
Barra inferior de 4 posiciones: Inicio, Reportes, **Anotar** (tecla naranja de 72 × 56 px en el centro) y Perfil. Rótulos mono de 11 px en mayúsculas, ícono de 22 px, la pestaña actual en tinta con barra de acento de 3 px (en el riel de escritorio, barra a la izquierda). Los rótulos no crecen más allá de 3,4 % del ancho para no pisarse con el texto al 200 %.

### Sheet (hoja inferior)
Modal con filete superior de 2 px, 16 px de radio arriba, máximo 560 px de ancho y 92 % del alto. Foco atrapado, Escape la cierra, botón Cerrar de 44 px siempre visible. Con una hoja o un diálogo abierto, los avisos de éxito se ocultan y los errores suben arriba.

### Signature: Medidor y tramas
El **Meter** son 10 segmentos con borde de tinta; el exceso es un segmento aparte, rayado diagonal en rosa: se distingue por forma, no solo por tono. El **DitherBar** reparte un todo en tramas (puntos, rayas, sólido) con leyenda en texto y porcentajes aparte.

### Signature: Saldo en puntos
El **Odometer** hace rodar cada dígito (`transform`, 800 ms, desacelerado) y deja un `role="img"` con el valor completo. Con "reducir movimiento" no se desplaza.

## Do's and Don'ts

### Do:
- **Do** reservar el naranja para lo que se puede tocar (botón principal, numerales, pestaña actual, foco).
- **Do** mostrar el estado con texto + ícono (+ forma): "Superado por $ 26.302.374" con ícono de alerta; el gasto "−$ 29.800" en tinta; el ingreso "+$ 120.000" en verde.
- **Do** poner en Doto con el "$" naranja la cifra protagonista de cada pantalla (saldo, gasto mensual) y pasar a mono desde los 12 caracteres.
- **Do** dar 44 px de alto como mínimo a todo lo que se toca y 56 px a las acciones principales.
- **Do** componer los montos con `parseAmountInput` y mostrarlos con separador argentino (`$ 15.373.721`).
- **Do** usar los tokens de `src/styles/tokens.css` y los componentes de `src/components/ui/`.
- **Do** mover solo `transform` y `opacity`, y respetar `prefers-reduced-motion`.
- **Do** probar cada pantalla en claro y oscuro, a 320, 393 y ~1100 px, con texto al 200 % y con datos de peor caso.
- **Do** escribir en voseo rioplatense ("Anotá", "Pagá", "Elegí"), sin jerga, diciendo qué dibujo buscar y qué tocar.
- **Do** ofrecer Deshacer con un aviso en lugar de un segundo diálogo cuando la acción es reversible; confirmaciones que no borran con `destructive: false`.

### Don't:
- **Don't** usar el naranja para marcar un estado ni como decoración.
- **Don't** distinguir algo solo por color (ingreso/gasto, vencido, categoría, superado).
- **Don't** usar degradé, vidrio, desenfoque de fondo, resplandores, bordes laterales de color en tarjetas ni emoji como marca.
- **Don't** usar sombras difusas (salvo el aviso).
- **Don't** usar `style={{…}}` con valores fijos, colores hex sueltos ni los alias antiguos (`--text-primary`, `--spacing-*`, …): solo los lee Grupos.
- **Don't** usar `--acc` como texto sobre `--chip` en el tema claro (3,97:1).
- **Don't** cortar una cifra con puntos suspensivos: se acortan los nombres, nunca los montos.
- **Don't** rediseñar ni mostrar Grupos: está fuera de la Beta.
- **Don't** hacer que "Instalar la app" deje de ser la acción principal de la Landing (decisión del usuario).
