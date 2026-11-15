# feat(ui): Reportes con el sistema "Panel de taller"

## Qué cambia en producción

- **Alertas**: una sola línea ("2 topes superados · 1 cerca del límite") con el botón "Ver topes", en lugar de una pila de avisos (hallazgo 14).
- **00 Topes del mes**: las 6 categorías siempre visibles (antes desaparecían si el mes no tenía gastos y no se podía poner un tope). Cada renglón es un solo botón con trama de la categoría, gastado / tope, medidor de 10 segmentos y estado en texto con ícono: "Quedan $ 41.419", "Cerca del límite · 93%", "Llegaste al tope", "Superado por $ 87.499", "Sin tope" (hallazgos 4 y 13).
- **Tope en una hoja**: se edita en una `Sheet` con `parseAmountInput` ("1.500" = 1500; el `type="number"` anterior lo leía como 1,5). "Quitar tope" manda 0, que `setBudget` ya acepta como "sin tope". Resultado en toast; el error del servidor queda dentro de la hoja.
- **01 En qué se fue**: barra de tramas + leyenda con monto y porcentaje, de mayor a menor. Reemplaza la torta sin etiquetas.
- **02 Últimos 6 meses**: barras propias en CSS (Entró sólida, Salió rayada), eje "$ 0 / $ 1 M / $ 2 M" y "Ver en tabla" con los montos completos. Reportes ya no usa recharts.
- **Cambio de número, a propósito**: el gráfico viejo contaba como "Gastos" todo lo que no era ingreso, **incluidas las transferencias entre cuentas**. Ahora cada mes sale de `calculateTotalsAndCategories` (la misma función del Inicio, sin modificarla), así que las transferencias no suman. Hay una prueba que lo fija.

No se tocó la capa de datos: `functions/`, `api/`, reglas, `services/api.js`, `money.js`, `mappers.js`, `calculations.js` ni los hooks. `App.jsx` solo pasa `monthLabel`.

## Antes / después

| | Antes | Después |
|---|---|---|
| Alertas y topes | `audit/11-reportes-alertas.jpg`, `audit/12-reportes-presupuestos.jpg` | `reports/01-topes-oscuro.jpg`, `reports/04-topes-claro-320.jpg` |
| Distribución y 6 meses | `audit/12-reportes-presupuestos.jpg` | `reports/02-distribucion-6-meses-oscuro.jpg`, `reports/05-tabla-claro-320.jpg` |
| Editar tope | (campo inline con engranaje de 16 px) | `reports/03-hoja-tope-393.jpg` |
| Escritorio | `audit/20-escritorio-1440.jpg` | `reports/06-escritorio-claro.jpg` |

(Rutas relativas a `docs/ui-redesign/`.)

## Cómo probarlo

1. Preview de Vercel → Reportes.
2. Tocar una categoría, escribir `50.000`, Guardar: cambia el renglón y la línea de alertas.
3. Volver a abrirla y "Quitar tope".
4. Ir a un mes sin gastos: los topes siguen, la distribución muestra el estado vacío.
5. "Ver en tabla" en Últimos 6 meses.

## Verificación

- `npm run lint` (0 errores, 9 avisos conocidos), `npm test` (217 pruebas; 53 nuevas de Reportes) y `npm run build`: pasan.
- Navegador integrado contra el emulador, 393 px, 320 px y 1100 px, claro y oscuro: sin scroll horizontal, ningún control de menos de 44 px (script con `getBoundingClientRect`), guardar y quitar un tope de punta a punta, Escape cierra la hoja y el foco vuelve al renglón, mes vacío.
- Casos extremos (cifras de 15 dígitos, negativos, categorías desconocidas, tope 0, gastado = tope, 79/80/100 %) cubiertos en pruebas, no a mano. No se corrió la skill `break-ui`.

## No probado / límites

- Safari, iPhone real y lector de pantalla.
- Los porcentajes de la leyenda se redondean por separado y pueden sumar 99 o 101.
- Si se reabre la hoja mientras el toast del guardado anterior sigue visible, el toast tapa "Guardar tope" unos segundos (se puede cerrar).
- En escritorio los medidores se estiran al ancho de la columna (880 px).
- Quedan sin uso las reglas `.budget-alert` de `src/index.css` y la dependencia `recharts` (solo la importa `dashboard/ExpenseChart.jsx`, huérfano): se limpian en la fase 5, con OK.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
