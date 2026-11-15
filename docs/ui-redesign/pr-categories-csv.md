# Gastos fijos con las 6 categorías y CSV para Excel (decisiones 3 y 4)

## Qué cambia en producción

- **Gastos fijos usa las mismas 6 categorías que el resto de la app** (Comida, Compras, Hogar, Transporte, Servicios, Otros). Antes ofrecía "Entretenimiento", "Software" y otras que no existían en topes ni en Reportes. El gasto fijo nuevo arranca en "Servicios".
  - Un gasto fijo viejo con otra categoría se muestra como **"Otros"** al abrirlo, con un aviso ("Antes era «Entretenimiento». Elegí una de las categorías de la app."), y se actualiza a la que elijas al guardar. Si nunca lo abrís, queda como está, y Reportes lo sigue contando en "Otros" como hasta ahora.
- **El CSV se abre bien en Excel en español**: columnas separadas con `;`, montos con coma decimal (`1250000,75`, no `1250000.75`), fechas `dd/mm/aaaa`, encabezados con tilde (Categoría, Descripción) y renglones con salto de línea de Windows. Antes, con comas y punto decimal, Excel en español abría todo en una sola columna y leía los montos como texto. Google Sheets también lo abre bien.
- No cambia nada en el servidor, en las reglas ni en los datos guardados.

## Cómo probarlo

1. Gastos fijos → abrir uno → Categoría muestra las 6 categorías. Con `peor@prueba.test` (emulador), el gasto fijo "Netflix + Spotify…" trae "Entretenimiento" y se ve como "Otros" con el aviso.
2. Perfil → Exportar CSV → abrirlo en Excel (español): cinco columnas separadas, la fecha como fecha y el monto como número que se puede sumar.

## Verificación

- Lint 0 errores (9 avisos conocidos). Pruebas: **331 → 333** (2 nuevas del CSV; las de Gastos fijos se reescribieron). Build OK.
- Navegador (Playwright, emulador): descargué el CSV del usuario `peor`; empieza con BOM, usa `;`, `1250000,75` y `1234,5` como montos, `\r\n` entre renglones y 50 filas más el encabezado. La hoja del gasto fijo viejo muestra las 6 opciones, "Otros" preseleccionada y el aviso (`docs/ui-redesign/subscriptions/categoria-vieja-claro-393.png`).

## No probado / límites

- **No abrí el CSV en Excel** (no hay Excel acá). El formato sigue lo que Excel en español (Argentina) espera. Si la computadora usa la configuración regional de Estados Unidos (coma de lista y punto decimal), Excel puede abrirlo en una columna: en ese caso hay que importarlo con "Datos → Desde texto/CSV" y elegir `;`. Lo dejé sin la línea `sep=;` porque aparecería como un renglón más en Google Sheets.
- Los gastos fijos que ya existían con una categoría vieja **no se migran solos** (haría falta tocar el servidor o abrirlos uno por uno). Los pagos ya hechos con esas categorías siguen contándose como "Otros" en Reportes y no cuentan para el tope de "Otros".
- Safari, iPhone real y lector de pantalla.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
