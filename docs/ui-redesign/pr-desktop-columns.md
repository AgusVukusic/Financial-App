# Dos columnas en escritorio (decisión 7)

## Qué cambia en producción

Desde **1024 px de ancho** (compu o tablet apaisada), tres pantallas se parten en dos columnas. Por debajo de 1024 px no cambia nada.

- **Inicio:** a la izquierda el saldo, "Anotar rápido", "Para pagar" y "Cuentas"; a la derecha "Movimientos". La barra del mes queda arriba, a todo el ancho.
- **Reportes:** a la izquierda la línea de alertas y "00 Topes del mes" (con el ritmo del mes); a la derecha "01 En qué se fue" y "02 Últimos 6 meses".
- **Gastos fijos:** a la izquierda "00 Resumen" con el botón "Nuevo gasto fijo"; a la derecha "01 Vencimientos".
- **Perfil sigue en una columna** de 880 px, pero alineada a la izquierda del contenido (decisión del usuario, opción B, ver abajo).
- El contenido pasa de 880 a **1120 px** de ancho máximo (columnas de 5 y 6 partes, con 32 px entre ellas). Las hojas (anotar, tope y gasto fijo, las que medí) siguen centradas en la ventana.
- No cambia nada en el servidor, las reglas, los hooks ni los datos. La numeración de las secciones queda igual ("03 Movimientos" sigue siendo 03).

## Cómo está hecho

- Dos contenedores nuevos en `src/components/ui/Columns.jsx` (`Columns` y `Column`, con su CSS). Por debajo de 1024 px valen `display: contents`: no generan caja, así que los hijos se apilan como antes. Desde 1024 px, `Columns` es una grilla y cada `Column` una pila vertical.
- `Layout` fija el contenido en 1120 px desde 1024 px y le agrega la clase `layout__main--narrow` solo a Perfil, cuyos hijos directos (encabezado y pantalla) se quedan en 880 px, pegados al borde izquierdo.
- **Orden de Tab:** no se cambió el DOM, solo se agruparon los hijos. Sigue siendo: "Saltar al contenido" → navegación → encabezado y mes → columna izquierda entera → columna derecha.

## Antes / después

- Antes: `docs/ui-redesign/reports/06-escritorio-claro.jpg` (Reportes, una sola columna). Una sola columna de 880 px con mucho espacio vacío a los costados en una ventana ancha y una lista de Movimientos que empezaba debajo de cuatro secciones (hacía falta bajar mucho para ver los gastos del mes).
- Después (todas con `ana`):
  - `docs/ui-redesign/desktop-columns/inicio-claro-1100.png` y `inicio-oscuro-1100.png`
  - `reportes-claro-1100.png` y `reportes-claro-1440.png`
  - `gastos-claro-1100.png` y `perfil-claro-1100.png` y `perfil-claro-1440.png` (Perfil en 880 px a la izquierda)
  - `hoja-centrada-1100.png` (hoja de "Nuevo gasto fijo" abierta sobre las dos columnas)

## Cómo probarlo

1. Abrir Inicio, Reportes y Gastos fijos en una ventana de 1100 px o más: dos columnas. Achicarla por debajo de 1024 px: vuelve a una sola.
2. Perfil: sigue en una columna.
3. Con el teclado: Tab recorre la navegación, el encabezado, la columna izquierda y después la derecha.
4. Abrir una hoja (Anotar, un tope, "Nuevo gasto fijo"): aparece centrada en la ventana.

## Verificación

- Lint 0 errores (9 avisos conocidos). Pruebas: **405 → 408** (3 nuevas: `Columns` y la clase `layout__main--narrow` de `Layout`, en `shell.test.jsx`). Build OK.
- **Nada cambia por debajo de 1024 px:** con `ana`, medí la posición y el tamaño de todos los elementos del contenido y de la navegación (Inicio, Reportes, Perfil y Gastos fijos) a 393, 768 y 1023 px en `main` y en esta rama: los 12 resultados dieron exactamente el mismo número de elementos y la misma huella de coordenadas. En cada corrida comprobé antes que el código era el que creía: en `main` no existe ningún contenedor `Columns` ni la clase `layout__main--narrow` en Perfil; en la rama sí.
- A 1023 px `Columns` es `display: contents` y el contenido mide 880 px; a 1024 px es una grilla (391 y 469 px) y el contenido 1120 px.
- Barrido con `ana` y `peor`: 1024, 1100 y 1440 px × claro/oscuro × texto 100 % y 200 % × las 4 pantallas (96 combinaciones): sin scroll horizontal y **ningún monto cortado con puntos suspensivos**. Lo que sí se acorta, como siempre, son nombres y el renglón de detalle de Movimientos (fecha · categoría · cuenta), nunca las cifras.
- Teclado: el orden de los controles en el DOM es columna izquierda y después derecha en Inicio y Gastos fijos; mi primer Tab arrancó en la navegación (venía de haber quitado el foco del botón Inicio, así que no probé el tramo "Saltar al contenido → navegación": ese orden sale del DOM, que no cambió). En Reportes la columna derecha no tiene controles que Tab alcance hasta abrir la tabla ("Ver en tabla" es un `details`, que mi barrido no cuenta).
- Las hojas de tope, de anotar y de gasto fijo quedan centradas en la ventana a 1100 px (centro 550 = mitad de la ventana).
- Detector de diseño de impeccable sobre los archivos tocados: 0 problemas. Un aviso informativo (`border-radius: 2px` en `Layout.css`, el indicador del riel) es anterior a este PR y no lo toqué.

## Decisión del usuario: Perfil alineado a la izquierda (opción B)

Con Perfil centrado en 880 px, el encabezado ("Hola, ana") se corría hacia los costados al cambiar de pestaña (borde izquierdo en 174 px contra 112 px a 1100 px de ancho). El usuario eligió la opción B: todo el contenido en 1120 px y Perfil en 880 px alineado a la izquierda. Medido después: el borde izquierdo del encabezado es 112 px en las cuatro pantallas a 1024 y 1100 px, y 222–224 px a 1440 px (los 2 px de diferencia son del scrollbar, que aparece en las pantallas largas y no en las cortas). Consecuencia: a 1440 px Perfil deja más espacio vacío a la derecha que a la izquierda.

## No probado / límites

- No se probó en una pantalla física, en Safari ni con lector de pantalla (el DOM no cambió, solo se agruparon los hijos).
- Con el teclado solo medí el orden del DOM y el primer Tab; no recorrí con Tab cada pantalla completa.
- Las columnas no son "pegajosas": si la izquierda es más corta que la derecha (Inicio con muchos movimientos), queda espacio vacío debajo de la izquierda. Preferí no pegarla: con muchas cuentas la columna izquierda puede ser más alta que la ventana y quedaría inalcanzable.
- La barra del mes sigue a todo el ancho del contenido (1088 px a 1440 px). Es un cambio chico de aspecto, pero no lo toqué por no cambiar más de lo pedido.
- Entre 768 y 1023 px sigue el riel lateral con una sola columna de 880 px, como hasta ahora.
- No probé movimiento reducido ni completo: no se agregó ninguna animación.
