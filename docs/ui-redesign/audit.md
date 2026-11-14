# Auditoría UI/UX — Financial App (fase 1)

Fecha: 2026-11-13. Entorno: app local contra emuladores, datos de `scripts/seed-emulators.js`.
Revisado en 375×812 y 1440×900, tema claro y oscuro. Las capturas están en `docs/ui-redesign/audit/`.

Flujos recorridos en la app real: registro, login sin verificar, activación rechazada y aceptada, crear cuenta,
cargar gasto, editar, eliminar, transferencia, editar presupuesto y pagar un gasto fijo.

No verificado: dispositivo físico (solo viewport emulado), lector de pantalla, modo instalado (standalone), y el
formulario "Añadir gasto fijo" (no llegó a renderizarse en la captura; revisado solo por código).

## Puntaje técnico

| Dimensión | Puntaje (0-4) | Hallazgo clave |
|---|---|---|
| Accesibilidad | 1 | Modales sin `role="dialog"`, sin Escape ni foco atrapado; contraste insuficiente en claro |
| Performance | 2 | `backdrop-filter` en casi todas las superficies; fuente por `@import` bloqueante |
| Theming | 2 | Hay tokens, pero ~270 estilos inline y los colores semánticos no se redefinen en claro |
| Responsive | 2 | Funciona en 375 px con desbordes; escritorio es la columna móvil estirada a 800 px |
| Integridad de implementación | 1 | Dos sistemas de diálogo, 5 pantallas sin CSS propio, breakpoints dispares (480/600/640/768) |
| **Total** | **8/20** | Pobre: justifica rehacer el sistema, no parchear |

## Hallazgos priorizados

Formato: severidad · pantalla · problema · impacto · propuesta · evidencia.

### Alta

1. **Alta · Modal de movimiento (transferencia) · El selector "Hacia" queda fuera de pantalla en 375 px** (el contenido mide 682 px dentro de un modal de 369 px) · No se ve a qué cuenta va la plata; hay que descubrir un scroll horizontal · Apilar "Desde/Hacia" en vertical · `17-transferencia-desborde.jpg`, `AddTransactionModal.jsx:160-178`.
2. **Alta · Modal de movimiento · Cargar un gasto exige scroll y 5 campos de igual peso** (contenido 917 px en un modal de 729 px; "Guardar" queda oculto; el monto no recibe foco; teclado sin `inputmode="decimal"`) · El flujo principal de la app es lento: abrir, tocar monto, tipear, scrollear, guardar · Hoja inferior con monto grande y foco automático, categorías como chips, cuenta y fecha con valores por defecto colapsados, botón guardar fijo · `06-modal-gasto-oscuro.jpg`, `AddTransactionModal.jsx:145-200`.
3. **Alta · Lista de movimientos · Editar y eliminar miden 24×24 px y están pegados** · Es fácil borrar cuando se quería editar, en una lista de plata real · Fila completa tocable que abre el detalle; acciones dentro (o swipe), nunca dos íconos chicos por fila · `08-dashboard-lista-oscuro.jpg`, `TransactionList.jsx:76-85`.
4. **Alta · Global · Objetivos táctiles menores a 44 px en toda la app**: tabs de navegación 40×40, flechas de mes 32×32, tema 36×36, "Nueva" 78×26, "Gestionar" 33 px de alto, engranaje de presupuesto ~16 px, selector Gasto/Ingreso 36 px · Toques fallidos constantes en el celular · Mínimo 44 px en el sistema de componentes base · medición en vivo; `Button.module.css:65-86`, `Layout.css:39`, `Reports.jsx:161-170`.
5. **Alta · Tema claro · Colores semánticos sin contraste suficiente**: verde 2,4:1, ámbar 2,1:1, rojo 3,5:1, texto atenuado 3,5:1 (mínimo 4,5:1). En oscuro, el texto atenuado da 2,6:1 · Montos de ingresos/gastos y estados difíciles de leer al sol · Redefinir éxito/peligro/aviso por tema · `10-dashboard-lista-claro.jpg`, `index.css:57-76` (el tema claro no redefine `--success/--danger/--warning`).
6. **Alta · Modales y diálogos · Sin `role="dialog"`, sin cierre con Escape, sin foco atrapado ni devuelto; el fondo sigue scrolleando detrás del diálogo** · Inusable con teclado o lector de pantalla; en el celular el fondo se mueve bajo el aviso · Un único componente Sheet/Dialog accesible · `16-pago-aviso-bloqueante.jpg` (lista desplazada detrás), `ConfirmDialog.jsx:23-47`, `DialogContext.jsx:59-101`.
7. **Alta · Login · Quien intenta entrar antes de verificar el email queda trabado**: después de verificar, "Ingresar" no hace nada y el aviso rojo "no está verificado" sigue fijo hasta recargar la página · Bloquea el primer ingreso de un invitado nuevo · Volver a evaluar la sesión tras el login y cerrar el aviso (toca `App.jsx`/`WelcomeScreen.jsx`, no la capa de datos) · `03-login-sin-verificar.jpg`, `WelcomeScreen.jsx:28-34`.
8. **Alta · Navegación · La barra flotante tapa contenido**: el estado vacío "No hay transacciones todavía", la leyenda del gráfico y la última fila quedan debajo · Información ilegible o intocable · Barra anclada al borde con `safe-area-inset-bottom` y padding inferior correcto · `05-dashboard-vacio-toast.jpg`, `11-reportes-alertas.jpg`, `Layout.css:15-29`.

### Media

9. **Media · Dashboard · La jerarquía no responde "¿cómo vengo este mes?"**: el número protagonista es el patrimonio total (no cambia con el mes) y los movimientos recién aparecen tras ~1,5 pantallas · Lo más consultado está lejos · Protagonista = gastado/disponible del mes; movimientos más arriba; cuentas compactas · `07-dashboard-oscuro.jpg`.
10. **Media · Dashboard · Las cuentas son un carrusel cortado sin indicio y los nombres largos se truncan o rompen** · Saldos ocultos (la tarjeta muestra "-$401.4…") · Lista compacta o carrusel con snap y "ver todas" · `07-dashboard-oscuro.jpg`, `20-escritorio-1440.jpg`.
11. **Media · Gastos fijos · Pagar requiere confirmar y después cerrar un segundo diálogo "Aviso / Entendido"** · Dos interrupciones para una acción frecuente · Confirmación única y resultado como toast con "Deshacer" · `15-pago-confirmar.jpg`, `16-pago-aviso-bloqueante.jpg`.
12. **Media · Gastos fijos · No es una pestaña ni tiene "volver"**: se entra por "Gestionar", la navegación no marca nada activo y la pantalla abre con el scroll heredado del dashboard · Desorientación · Darle lugar propio en la navegación o encabezado con volver · `14-gastos-fijos.jpg`.
13. **Media · Reportes · El color significa dos cosas a la vez**: el punto de categoría y la barra de progreso usan paletas distintas (Compras tiene punto verde y barra roja); la torta no tiene etiquetas ni total · Hay que descifrar el gráfico · Color de categoría solo para identificar; estado con barra neutra + texto ("te pasaste $87.499") · `12-reportes-presupuestos.jpg`, `Reports.jsx:26`.
14. **Media · Reportes · Tres alertas apiladas empujan el contenido y ejes con "$2000k"** · La pantalla abre con ruido antes del dato · Resumir alertas en una línea y formatear "$2 M" · `11-reportes-alertas.jpg`.
15. **Media · Toasts · Aparecen arriba tapando el saludo y el botón de tema, y el de error no se cierra solo** · Tapan controles; el botón de cierre mide ~24 px · Ubicarlos sobre la navegación, con cierre automático · `19-toast-tapa-contenido.jpg`, `05-dashboard-vacio-toast.jpg`.
16. **Media · Errores · Se muestran mensajes técnicos** ("Firebase: Error (auth/network-request-failed)") · No dice qué hacer · Mensajes humanos con acción ("Sin conexión. Reintentá.") · `02-registro-error-crudo.jpg`, `WelcomeScreen.jsx:58`.
17. **Media · Identidad · Estética genérica**: degradé índigo→violeta, paneles de vidrio con blur, resplandores, borde lateral de color en tarjetas (el detector de impeccable lo marca en 5+ lugares), emoji 👋 como marca · No se siente propia ni "nativa" · Es el objetivo de la fase 2 · `01-landing-375.jpg`, `SubscriptionsManager.css:130-138`, `Toast.css:28`.
18. **Media · Tema claro · Modales y diálogos translúcidos sobre fondo oscurecido quedan grises y lavados**; inputs con fondo `rgba(0,0,0,.2)` · Poco contraste justo donde se tipea · Superficies opacas en hojas y diálogos · `17-transferencia-desborde.jpg`, `15-pago-confirmar.jpg`.
19. **Media · Escritorio · Es la columna móvil centrada (máx. 800 px) con una barra lateral flotante** · Espacio desaprovechado, cuentas igual cortadas · Layout de 2 columnas en ≥1024 px · `20-escritorio-1440.jpg`, `Layout.css:127-165`.
20. **Media · PWA · Falta base nativa**: sin `theme-color` ni `viewport-fit=cover`, sin `apple-touch-icon`, color del manifest `#0f172a` distinto a la app, ícono servido desde un CDN externo (flaticon), inputs de 14,4 px (iOS hace zoom al enfocar), sin manejo de safe areas · Se siente "web en un navegador" · Íconos propios, metas, inputs ≥16 px · `index.html`, `vite.config.js:14-28`.
21. **Media · Movimiento · Ningún `prefers-reduced-motion`; las entradas escalonadas dejan la pantalla semivacía ~1 s en cada cambio de pestaña** · Sensación de lentitud; problema para usuarios sensibles · Transiciones cortas (150-250 ms) y alternativa reducida · `05-dashboard-vacio-toast.jpg` (captura a mitad de animación), `index.css:134-156`.

### Baja

22. **Baja · Lista · La transferencia se ve como un "$ 200.000" neutro sin origen→destino; el ícono de categoría es rojo para todo gasto** · Menos legible de un vistazo · "Mercado Pago → Ahorros" y color por categoría · `09-lista-descripcion-larga.jpg`.
23. **Baja · Perfil · Pantalla casi vacía**: "Plan Cloud Activo" no significa nada, PDF/CSV sin decir que exportan, no muestra el email ni el tema · Mover acá tema, exportación rotulada y datos de la cuenta · `13-perfil.jpg`.
24. **Baja · Textos · Mezcla de tuteo y voseo** ("Registra tus gastos", "Regístrate" vs. "Elegí una cuenta", "Intentá de nuevo"), títulos En Mayúsculas Tipo Título y diálogos genéricos ("Confirmar", "Aviso") · Unificar en voseo rioplatense y títulos en minúscula.
25. **Baja · Landing · "Descargar App" es el botón principal aunque la acción real es entrar; el título de la pestaña dice "Dashboard" antes de iniciar sesión** · `01-landing-375.jpg`.
26. **Baja · Código de UI · ~270 estilos inline y 5 pantallas sin CSS propio; dos implementaciones de diálogo** · Se resuelve al rehacer el sistema (fase 3).

## Lo que funciona y conviene conservar

- Montos grandes y con buen peso; formato `$ 15.373.721` claro.
- Estados de gastos fijos ("Venció hace 3 días", "Vence en 2 días") útiles y bien redactados.
- La confirmación de pago nombra monto y cuenta.
- Hay estados vacíos y `aria-label` en las acciones de la lista.
- Sin scroll horizontal de página en 375 px; el selector de mes es simple y entendible.

## Necesidades sobre la capa de datos

Ninguna por ahora. El punto 7 se resuelve en `App.jsx`/`WelcomeScreen.jsx`.

## Preguntas de gusto

1. ¿Qué apps te gustan cómo se ven o se usan (finanzas o no)? Por ejemplo Mercado Pago, Ualá, Revolut, Copilot Money, Apple Wallet, Linear, Things.
2. Tono: ¿sobrio y calmo, cálido y amigable, o enérgico y con carácter?
3. Color: ¿casi monocromo con un solo acento, o colorido (por ejemplo, un color por categoría)?
4. ¿Qué tema usás más, claro u oscuro? ¿Debe seguir al sistema por defecto?
5. ¿Qué querés ver primero al abrir la app: cuánto gastaste este mes, cuánto te queda del presupuesto, o el saldo total?
