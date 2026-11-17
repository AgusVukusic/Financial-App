# Dos columnas en escritorio (decisión 7)

## Qué cambia en producción

Desde **1024 px de ancho** (compu o tablet apaisada), tres pantallas se parten en dos columnas. Por debajo de 1024 px no cambia nada.

- **Inicio:** a la izquierda el saldo, "Anotar rápido", "Para pagar" y "Cuentas"; a la derecha "Movimientos". La barra del mes queda arriba, a todo el ancho.
- **Reportes:** a la izquierda la línea de alertas y "00 Topes del mes" (con el ritmo del mes); a la derecha "01 En qué se fue" y "02 Últimos 6 meses".
- **Gastos fijos:** a la izquierda "00 Resumen" con el botón "Nuevo gasto fijo"; a la derecha "01 Vencimientos".
- **Perfil sigue en una columna** de 880 px, como hoy.
- El contenido de esas tres pantallas pasa de 880 a **1120 px** de ancho máximo (columnas de 5 y 6 partes, con 32 px entre ellas). Las hojas (anotar, tope, gasto fijo, cuenta) siguen centradas en la ventana.
- No cambia nada en el servidor, las reglas, los hooks ni los datos. La numeración de las secciones queda igual ("03 Movimientos" sigue siendo 03).

## Cómo está hecho

- Dos contenedores nuevos en `src/components/ui/Columns.jsx` (`Columns` y `Column`, con su CSS). Por debajo de 1024 px valen `display: contents`: no generan caja, así que los hijos se apilan como antes. Desde 1024 px, `Columns` es una grilla y cada `Column` una pila vertical.
- `Layout` agrega la clase `layout__main--wide` (ancho 1120 px desde 1024 px) a todo menos Perfil.
- **Orden de Tab:** no se cambió el DOM, solo se agruparon los hijos. Sigue siendo: "Saltar al contenido" → navegación → encabezado y mes → columna izquierda entera → columna derecha.

## Antes / después

- Antes: una sola columna de 880 px con mucho espacio vacío a los costados en una ventana ancha y una lista de Movimientos que empezaba debajo de cuatro secciones (hacía falta bajar mucho para ver los gastos del mes).
- Después (todas con `ana`):
  - `docs/ui-redesign/desktop-columns/inicio-claro-1100.png` y `inicio-oscuro-1100.png`
  - `reportes-claro-1100.png` y `reportes-claro-1440.png`
  - `gastos-claro-1100.png`
  - `hoja-centrada-1100.png` (hoja de "Nuevo gasto fijo" abierta sobre las dos columnas)

## Cómo probarlo

1. Abrir Inicio, Reportes y Gastos fijos en una ventana de 1100 px o más: dos columnas. Achicarla por debajo de 1024 px: vuelve a una sola.
2. Perfil: sigue en una columna.
3. Con el teclado: Tab recorre la navegación, el encabezado, la columna izquierda y después la derecha.
4. Abrir una hoja (Anotar, un tope, "Nuevo gasto fijo"): aparece centrada en la ventana.

## Verificación

- Lint 0 errores (9 avisos conocidos). Pruebas: **405 → 408** (3 nuevas: `Columns` en `shell.test.jsx` y la clase de ancho de `Layout`). Build OK.
- **Nada cambia por debajo de 1024 px:** con `ana`, medí la posición y el tamaño de todos los elementos del contenido y de la navegación (Inicio, Reportes, Perfil y Gastos fijos) a 393, 768 y 1023 px, sin los cambios y con ellos: los 12 resultados dieron exactamente el mismo número de elementos y la misma huella de coordenadas.
- A 1023 px `Columns` es `display: contents` y el contenido mide 880 px; a 1024 px es una grilla (391 y 469 px) y el contenido 1120 px.
- Barrido con `ana` y `peor`: 1024, 1100 y 1440 px × claro/oscuro × texto 100 % y 200 % × las 4 pantallas (96 combinaciones): sin scroll horizontal y **ningún monto cortado con puntos suspensivos**. Lo que sí se acorta, como siempre, son nombres y el renglón de detalle de Movimientos (fecha · categoría · cuenta), nunca las cifras.
- Teclado: el orden de los controles en el DOM es columna izquierda y después derecha en Inicio y Gastos fijos; el primer Tab entra por la navegación. En Reportes la columna derecha no tiene controles que Tab alcance hasta abrir la tabla ("Ver en tabla" es un `details`, que mi barrido no cuenta).
- Las hojas de tope, de anotar y de gasto fijo quedan centradas en la ventana a 1100 px (centro 550 = mitad de la ventana).
- Detector de diseño de impeccable sobre los archivos tocados: 0 problemas. Un aviso informativo (`border-radius: 2px` en `Layout.css`, el indicador del riel) es anterior a este PR y no lo toqué.

## No probado / límites

- No se probó en una pantalla física, en Safari ni con lector de pantalla (el DOM no cambió, solo se agruparon los hijos).
- Con el teclado solo medí el orden del DOM y el primer Tab; no recorrí con Tab cada pantalla completa.
- Las columnas no son "pegajosas": si la izquierda es más corta que la derecha (Inicio con muchos movimientos), queda espacio vacío debajo de la izquierda. Preferí no pegarla: con muchas cuentas la columna izquierda puede ser más alta que la ventana y quedaría inalcanzable.
- La barra del mes sigue a todo el ancho del contenido (1088 px a 1440 px). Es un cambio chico de aspecto, pero no lo toqué por no cambiar más de lo pedido.
- Entre 768 y 1023 px sigue el riel lateral con una sola columna de 880 px, como hasta ahora.
- No probé movimiento reducido ni completo: no se agregó ninguna animación.
