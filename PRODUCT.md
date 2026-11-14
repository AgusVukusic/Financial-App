# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas cercanas al autor (círculo chico, Beta por invitación), en Argentina, que llevan sus finanzas personales
desde el celular. Usan la app varias veces por semana para registrar un gasto en el momento y revisar cómo vienen.
Usan tema oscuro y claro por igual (el oscuro algo más). Confirmado por el usuario: lo primero que quieren ver al abrir
es el saldo total.

## Product Purpose

Registrar gastos, ingresos y transferencias entre cuentas (banco, billetera virtual, efectivo, tarjeta), seguir
presupuestos por categoría y pagar gastos fijos. Éxito: cargar un gasto en pocos toques y entender de un vistazo cuánta
plata hay y cómo va el mes.

## Positioning

Libro contable inmutable y servidor-autoritativo: los movimientos no se editan, se anulan o reemplazan, y los saldos los
calcula el servidor. Pensada para pesos argentinos (ARS), sin conexión bancaria automática.

## Operating Context

PWA instalada en el celular, uso de una mano, en la calle o en el momento del gasto. Montos en pesos con separador de
miles argentino (`$ 15.373.721`). UI en español rioplatense (voseo). Escritorio es secundario.

## Capabilities and Constraints

- Cuentas, movimientos (gasto, ingreso, transferencia), presupuestos por categoría, gastos fijos con pago en un paso,
  reportes (evolución de 6 meses y distribución por categoría), exportación PDF/CSV.
- Grupos queda fuera de la Beta y no se muestra.
- La capa de datos, `functions/`, `api/` y las reglas de Firestore no cambian con el rediseño.
- Moneda única ARS. Categorías fijas: Comida, Compras, Hogar, Transporte, Servicios, Otros.

## Brand Commitments

Nombre de la app en la UI: "Finanzas Personales" (manifest), repositorio "Financial App". Sin logo ni identidad previa
que conservar. El usuario no tiene referencias favoritas ni rechazos; pidió ver opciones. Binding: lo que necesite
distinguirse (ingreso/gasto, estado de presupuesto, vencimientos) debe distinguirse con claridad.

## Evidence on Hand

Sin testimonios ni métricas. Datos de demostración en `scripts/seed-emulators.js` (sintéticos, solo emulador).

## Product Principles

1. El saldo total manda en la primera pantalla.
2. Registrar un gasto es la acción más frecuente y debe costar pocos toques.
3. Lo que significa algo distinto se ve distinto (estado, categoría, signo del monto), nunca solo por color.
4. Claro y oscuro son ciudadanos de primera, ambos con contraste AA.
5. Accesible: objetivos táctiles de 44 px o más, foco visible, movimiento reducido respetado.

## Accessibility & Inclusion

WCAG AA como mínimo; objetivos táctiles de 44 px; `prefers-reduced-motion`; uso con una mano en pantallas de 375 px.
