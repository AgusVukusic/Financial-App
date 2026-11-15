# feat(ui): Perfil con el sistema "Panel de taller" y exportaciones corregidas

## Qué cambia en producción

- **00 Cuenta**: nombre y **email** visibles (el email largo se parte en renglones, no se recorta). Se va el avatar de color y "Plan Cloud Activo", que no significaba nada (hallazgo 23).
- **01 Exportar movimientos**: dos acciones rotuladas de 56 px ("Descargar PDF · Para imprimir o compartir", "Descargar CSV · Para abrir en Excel o Google Sheets"), con la cantidad de movimientos y el orden (del más nuevo al más viejo). Sin movimientos quedan deshabilitadas con una explicación. El resultado se avisa con un toast ("Se descargó mis_finanzas_2026-11-15.csv") y los errores también.
- **02 Sesión**: "Cerrar sesión" deja de ser un botón rojo; pide una confirmación no destructiva que aclara que los datos quedan guardados.
- **Exportaciones (`utils/formatters.js`), errores corregidos:**
  - Las **transferencias salían como "Gasto"** en PDF y CSV. Ahora: Ingreso / Gasto / Transferencia.
  - **CSV**: una descripción con `#` cortaba el archivo (se armaba con un `data:` URI); las comillas y comas en los textos rompían las columnas. Ahora se genera con `Blob`, todos los textos van entre comillas con `"` escapadas, lleva BOM para que Excel lea los acentos, y un texto que empieza con `=`, `+`, `-` o `@` va con `'` adelante para que la planilla no lo tome como fórmula. El archivo ahora lleva la fecha en el nombre.
  - **PDF**: título "Movimientos · Finanzas Personales" y encabezado de tabla en tinta neutra (antes, el azul de la marca vieja).
  - No cambian las columnas, el separador (coma) ni el formato de montos y fechas.

No se tocó la capa de datos. `App.jsx` solo pasa `email`.

## Antes / después

| | Antes | Después |
|---|---|---|
| Perfil | `audit/13-perfil.jpg` | `profile/01-perfil-claro-393.jpg`, `profile/02-perfil-oscuro-393.jpg` |
| Cerrar sesión | (botón rojo + confirmación roja) | `profile/03-cerrar-sesion.jpg` |
| Email largo a 320 px | — | `profile/04-email-largo-320.png` |
| Escritorio | — | `profile/05-escritorio-oscuro.jpg` |

(Rutas relativas a `docs/ui-redesign/`.)

## Cómo probarlo

1. Preview de Vercel → Perfil.
2. "Descargar CSV" y abrirlo en Excel o Google Sheets: acentos bien, transferencias rotuladas, columnas en su lugar.
3. "Descargar PDF" y revisar la tabla.
4. "Cerrar sesión" → Cancelar; después confirmar.

## Verificación

- `npm run lint` (0 errores, 9 avisos conocidos), `npm test` (273 pruebas; 16 nuevas de Perfil y 10 de exportación) y `npm run build`: pasan.
- Navegador integrado contra el emulador, 393 px claro y oscuro, 320 px y 1100 px: sin scroll horizontal, ningún control de menos de 44 px, email de 75 caracteres visible entero a 320 px.
- Exportaciones reales en el navegador, leyendo los archivos generados: el CSV tiene BOM, 26 filas, las transferencias dicen "Transferencia"; el PDF es un PDF válido de 2 páginas con el título nuevo y las transferencias rotuladas.
- Confirmación de cierre: botón primario (no rojo), foco inicial en "Cancelar", cancelar no cierra la sesión.

## No probado / límites

- **No abrí el CSV en Excel ni miré el PDF renderizado**: verifiqué el contenido de los archivos, no cómo se ven en esas aplicaciones.
- No confirmé el cierre de sesión hasta el final en el navegador (está cubierto en pruebas).
- Safari, iPhone real y lector de pantalla.
- Excel en español de Argentina suele esperar `;` como separador y coma decimal: con el separador coma puede abrir todo en una columna (Google Sheets lo lee bien). No lo cambié porque es una decisión de formato; avisame si lo querés.
- El hook no distingue "cargando" de "sin movimientos": durante el primer instante los botones aparecen deshabilitados.
- `profile/SubscriptionsCard.jsx` sigue huérfano (borrar con OK).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
