# App instalable: ícono propio, iOS y fuentes sin conexión (fase 5, unidad C)

## Qué cambia en producción

- **Ícono propio** (opción A que elegiste: el "$" de puntos en naranja sobre oscuro). Reemplaza dos cosas que no eran nuestras:
  - el ícono de la app instalada, que se bajaba de `cdn-icons-png.flaticon.com` (si esa URL caía o se bloqueaba, la app se instalaba sin ícono);
  - el favicon de la pestaña del navegador, que era el rayo violeta de Vite.
- **Tres PNG propios** en el manifest: 192 y 512 normales, y uno aparte para Android "maskable" (el ícono viejo declaraba las dos cosas juntas, `any maskable`, y Android lo recortaba mal). El ícono queda dentro de la zona segura: el "$" ocupa el centro y el fondo llena el cuadrado.
- **iPhone:** `apple-touch-icon` de 180 px (sin transparencia, como lo pide iOS) y las metas para que la app instalada abra a pantalla completa con el nombre "Finanzas" y la barra de estado en negro.
- **Manifest:** se agregan `lang: es`, `start_url` y `scope`. Nombre, nombre corto, colores y `display` no cambian (así que `APP_NAME` en `utils/installGuide.js` sigue valiendo).
- **Fuentes sin conexión:** las tres fuentes vienen de Google y la app no las guardaba. Ahora el service worker las guarda al verlas la primera vez (la hoja de estilos se refresca en segundo plano; los archivos duran un año). Sin conexión, la app abre con sus tipografías y no con las del sistema.
- El precache pasa de 8 a 13 archivos (los PNG, `apple-touch-icon` y favicon), 1766,55 KiB.

## Antes / después

- Opciones que se mostraron (A elegida): `docs/ui-redesign/pwa/opciones-icono.png`. Fuentes en SVG junto a ella.
- Favicon a 16, 32, 64 y 96 px: `docs/ui-redesign/pwa/favicon-16-32-64-96.png`. A 16 px el "$" se reduce a una mancha de puntos, pero se distingue del resto de pestañas.

## Cómo probarlo

1. `npm ci && npm run lint && npm test && npm run build`.
2. Probar la app real (sin conexión se prueba con el build, no con `npm run dev`): en Chrome, abrir el sitio una vez con internet, esperar unos segundos, cortar la conexión y recargar. La pantalla tiene que abrir con las tipografías de siempre.
3. Android (Chrome): menú ⋮ → "Instalar app". El ícono del escritorio tiene que ser el "$" de puntos, también si el sistema lo recorta en círculo.
4. iPhone (Safari): botón de compartir → "Agregar a inicio". Debe ofrecer el nombre "Finanzas" con el mismo ícono.
5. La pestaña del navegador muestra el "$" de puntos en lugar del rayo violeta.

## Verificación

Con el build servido por `vite preview`, en Chrome (Playwright), con el service worker registrado. Para esta prueba compilé con `vite build --mode development` porque el build de producción no trae las variables de Firebase en local y la app no arrancaba.

| Qué | Resultado |
|---|---|
| Manifest y ícono | `Page.getAppManifest` sin errores y `Page.getInstallabilityErrors` vacío (Chrome considera la app instalable). Los tres PNG responden 200 `image/png`. El manifest generado no tiene ninguna URL externa |
| Metas | `apple-touch-icon`, `apple-mobile-web-app-capable`, `-title` y `-status-bar-style`, `mobile-web-app-capable` y `rel=manifest` presentes en `index.html` |
| Service worker | Precache con los PNG y el favicon (13 archivos); rutas de ejecución `google-fonts-css` y `google-fonts-files` presentes en `sw.js`; `/api` sigue sin pasar por el index.html |
| Fuentes sin conexión | Con internet quedan en caché la hoja de estilos y 3 archivos de fuente. Con la red cortada y recarga, la Landing abre con Geist Mono y Hanken Grotesk cargadas desde la caché |
| Favicon | Visto a 16, 32, 64 y 96 px |

Pruebas: 331, sin cambios (no hay lógica nueva). Lint 0 errores (9 avisos conocidos). Build OK.

## No probado / límites

- **Instalación real en un iPhone y en un Android**: no lo pude hacer desde acá. Hay que ver que el ícono salga bien (en iOS se redondea solo; en Android depende del lanzador), y que la barra de estado negra en iOS se vea bien. **Pendiente tuyo**: seguir los pasos 3 y 4 de arriba.
- **Barra de estado de iOS**: elegí `black` (negra, con letras blancas) porque iOS no cambia con el tema de la app; con el tema claro queda una barra negra sobre fondo claro. `black-translucent` dejaría el contenido debajo de la barra con letras blancas, ilegibles en el tema claro.
- **Doto** (la fuente de los puntos) se guarda recién cuando se abre Inicio por primera vez (es donde se usa). Quien instale la app y se quede sin conexión antes de ver el saldo no la tendrá en caché.
- Los PNG se generaron desde el SVG con el propio navegador; no se probó otro tamaño que los de arriba, ni un ícono monocromo (Android 13 "ícono temático").
- Sigue sin seguirse la guía de instalación (Landing) en un iPhone ni un Android reales.
- Queda sin uso `public/icons.svg` (plantilla de Vite, con íconos de redes). No se borra sin tu OK.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
