// Detección del dispositivo y textos de la guía para instalar la app (lógica pura, sin DOM).
// Las opciones que la persona tiene que leer en pantalla van entre comillas angulares « ».

export const APP_NAME = 'Finanzas'; // short_name del manifest (vite.config.js)

export const INSTALL_ICONS = ['share', 'plus', 'dots', 'menu', 'monitor', 'check'];

const IN_APP = /FBAN|FBAV|Instagram|Line\//;

/**
 * @param {{ userAgent?: string, maxTouchPoints?: number }} env
 * @returns {'in-app'|'ios-safari'|'ios-other'|'android-samsung'|'android-firefox'|'android-chrome'|'desktop-safari'|'desktop-firefox'|'desktop-chromium'}
 */
export function detectInstallPlatform({ userAgent = '', maxTouchPoints = 0 } = {}) {
  const ua = userAgent;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);

  if (IN_APP.test(ua) || (isAndroid && /; wv\)/.test(ua))) return 'in-app';

  if (isIOS) return /CriOS|FxiOS|EdgiOS/.test(ua) ? 'ios-other' : 'ios-safari';

  if (isAndroid) {
    if (/SamsungBrowser/.test(ua)) return 'android-samsung';
    if (/Firefox/.test(ua)) return 'android-firefox';
    return 'android-chrome';
  }

  if (/Firefox/.test(ua)) return 'desktop-firefox';
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'desktop-safari';
  return 'desktop-chromium';
}

const SHARE_ROW = {
  icon: 'share',
  text: 'Tocá el botón de compartir: un cuadradito con una flecha hacia arriba. En el iPhone está abajo, en el medio de la pantalla; en el iPad, arriba a la derecha.',
};
const IOS_ADD = {
  icon: 'plus',
  text: 'Deslizá la lista hacia abajo y tocá «Agregar a inicio» (puede decir «Añadir a pantalla de inicio»).',
};
const IOS_CONFIRM = { icon: 'check', text: 'Tocá «Agregar», arriba a la derecha.' };

export const INSTALL_GUIDES = {
  'ios-safari': {
    device: 'iPhone o iPad (Safari)',
    intro: 'Se instala desde Safari en tres toques:',
    steps: [SHARE_ROW, IOS_ADD, IOS_CONFIRM],
    note: null,
  },
  'ios-other': {
    device: 'iPhone o iPad (Chrome u otro)',
    intro: 'Se instala en tres toques:',
    steps: [
      {
        icon: 'share',
        text: 'Tocá el botón de compartir: un cuadradito con una flecha hacia arriba, al lado de la dirección de la página.',
      },
      IOS_ADD,
      IOS_CONFIRM,
    ],
    note: 'Si no aparece «Agregar a inicio», abrí esta página en Safari (la brújula azul) y seguí los mismos pasos.',
  },
  'android-chrome': {
    device: 'Celular Android (Chrome)',
    intro: 'Se instala en tres toques:',
    steps: [
      { icon: 'dots', text: 'Tocá los tres puntitos que están arriba a la derecha de la pantalla.' },
      { icon: 'plus', text: 'En la lista que se abre, tocá «Agregar a pantalla principal» o «Instalar app».' },
      { icon: 'check', text: 'Confirmá tocando «Instalar» o «Agregar».' },
    ],
    note: `Si no ves ninguna de esas opciones, puede que ya la tengas instalada: buscá «${APP_NAME}» entre tus apps.`,
  },
  'android-samsung': {
    device: 'Celular Samsung (Internet de Samsung)',
    intro: 'Se instala en tres toques:',
    steps: [
      { icon: 'menu', text: 'Tocá las tres rayitas que están abajo a la derecha de la pantalla.' },
      { icon: 'plus', text: 'Tocá «Agregar página a» y después «Pantalla de inicio».' },
      { icon: 'check', text: 'Confirmá tocando «Agregar».' },
    ],
    note: null,
  },
  'android-firefox': {
    device: 'Celular Android (Firefox)',
    intro: 'Se instala en tres toques:',
    steps: [
      { icon: 'dots', text: 'Tocá los tres puntitos, al lado de la dirección de la página.' },
      { icon: 'plus', text: 'Tocá «Instalar» o «Agregar a la pantalla de inicio».' },
      { icon: 'check', text: 'Confirmá tocando «Agregar».' },
    ],
    note: null,
  },
  'desktop-chromium': {
    device: 'Computadora (Chrome o Edge)',
    intro: 'Se instala en dos clics:',
    steps: [
      {
        icon: 'monitor',
        text: 'Arriba, al final de la barra donde está la dirección de la página, hacé clic en el dibujo de una pantalla con una flecha.',
      },
      { icon: 'check', text: 'Hacé clic en «Instalar».' },
    ],
    note: 'Si no ves ese dibujo, hacé clic en los tres puntitos de arriba a la derecha y buscá la opción que dice «Instalar».',
  },
  'desktop-safari': {
    device: 'Mac (Safari)',
    intro: 'Se instala en dos clics:',
    steps: [
      { icon: 'menu', text: 'En la barra de arriba de la pantalla, hacé clic en «Archivo».' },
      { icon: 'plus', text: 'Hacé clic en «Agregar al Dock».' },
    ],
    note: null,
  },
  'desktop-firefox': {
    device: 'Computadora (Firefox)',
    intro:
      'Firefox no permite instalar apps en la computadora. Abrí esta página en Chrome o Edge para instalarla, o usala desde acá tocando «Ingresar».',
    steps: [],
    note: null,
  },
  'in-app': {
    device: 'Dentro de otra app',
    intro:
      'Estás viendo esta página dentro de otra app (Instagram, Facebook u otra), y desde acá no se puede instalar.',
    steps: [
      { icon: 'dots', text: 'Tocá los tres puntitos que están arriba a la derecha.' },
      { icon: 'share', text: 'Tocá «Abrir en Chrome», «Abrir en Safari» o «Abrir en el navegador».' },
      { icon: 'check', text: 'Cuando se abra, tocá «Instalar la app» de nuevo.' },
    ],
    note: null,
  },
};

export const INSTALL_CLOSING = 'Listo: la vas a encontrar junto a tus otras apps.';

export const OTHER_GUIDES_ORDER = [
  'ios-safari',
  'ios-other',
  'android-chrome',
  'android-samsung',
  'android-firefox',
  'desktop-chromium',
  'desktop-safari',
  'desktop-firefox',
];
