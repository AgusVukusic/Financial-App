# Limpieza del rediseño (fase 5, unidad A)

## Qué cambia en producción

Nada que se vea. Es código muerto que se saca: el rediseño ya no usa estos archivos.

## Qué se borra (lista autorizada por el usuario)

- `src/components/SubscriptionsManager.css`, `src/components/LandingPage.css`: CSS de las pantallas viejas (ya no se importaban).
- `src/components/profile/SubscriptionsCard.jsx`, `src/components/dashboard/ExpenseChart.jsx`: componentes huérfanos.
- Reglas `.budget-alert` de `src/index.css`.
- Capturas viejas de la Landing: `docs/ui-redesign/auth/01-landing-claro-393.jpg` y `06-instalar-oscuro-320.jpg`.
- Dependencia `recharts` (`package.json`, `package-lock.json` y la línea del `README.md`): solo la importaba `ExpenseChart.jsx`.

## Qué se ordena

- `ConfirmDialog`: el reparto del ancho de los botones pasa de `style={{ flex: 1 }}` a CSS.
- `tokens.css`: se quitan 24 alias legados que nada lee. Quedan 13 (`--bg-base`, `--bg-surface`, `--text-primary`, `--text-secondary`, `--accent-primary`, `--success`, `--danger`, `--warning`, `--border-color`, `--spacing-sm/md/lg/xl`) porque Grupos los usa y Grupos no se toca. Se borran junto con Grupos o cuando vuelva rediseñado.

## Cómo probarlo

1. `npm ci && npm run lint && npm test && npm run build`.
2. Abrir cualquier confirmación (por ejemplo cerrar sesión en Perfil): los dos botones tienen el mismo ancho.

## Verificación

- Lint: 0 errores, 9 avisos (los conocidos). Pruebas: 328, igual que antes (ninguna nueva). Build OK.
- Grep antes de borrar: ninguna referencia a los archivos ni a `recharts` en `src/`, `test/`, `scripts/` ni `vite.config.js`.
- Navegador (`/showcase.html`): los botones del diálogo miden 168 px cada uno.

## No probado / límites

- El tamaño del bundle no cambió (el precache sigue en 1765,23 KiB): `recharts` no entraba en el build porque nada la importaba. La ganancia es de dependencias instaladas, no de peso para quien usa la app.
- Quedan `style` con valores calculados en `Dither`, `Odometer`, `BalanceCard`, `MonthlyChart`, `SubscriptionsManager` y `showcase`: son dinámicos y se dejan. Los de Grupos no se tocan.
- Safari, iPhone real y lector de pantalla.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
