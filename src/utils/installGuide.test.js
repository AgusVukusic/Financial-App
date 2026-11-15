import { describe, it, expect } from 'vitest';
import {
  detectInstallPlatform,
  INSTALL_GUIDES,
  INSTALL_ICONS,
  INSTALL_CLOSING,
  OTHER_GUIDES_ORDER,
} from './installGuide';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1',
  iphoneFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15',
  ipadModern:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.99 Mobile Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-A536E Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/123.0.6312.99 Mobile Safari/537.36 Instagram 330.0.0.0.0 Android',
  instagramIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 Instagram 330.0.0.0.0 (iPhone14,5; iOS 17_4)',
  facebookIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 [FBAN/FBIOS;FBAV/450.0.0.0]',
  winChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  winEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  winFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
};

describe('detectInstallPlatform', () => {
  const cases = [
    ['iPhone Safari', UA.iphoneSafari, 5, 'ios-safari'],
    ['iPhone Chrome (CriOS)', UA.iphoneChrome, 5, 'ios-other'],
    ['iPhone Firefox (FxiOS)', UA.iphoneFirefox, 5, 'ios-other'],
    ['iPad moderno que dice Macintosh', UA.ipadModern, 5, 'ios-safari'],
    ['Mac de escritorio con Safari', UA.macSafari, 0, 'desktop-safari'],
    ['Mac con Chrome', UA.macChrome, 0, 'desktop-chromium'],
    ['Android Chrome', UA.androidChrome, 5, 'android-chrome'],
    ['Samsung Internet', UA.samsung, 5, 'android-samsung'],
    ['Firefox Android', UA.androidFirefox, 5, 'android-firefox'],
    ['Instagram en Android (WebView)', UA.instagramAndroid, 5, 'in-app'],
    ['Instagram en iOS', UA.instagramIOS, 5, 'in-app'],
    ['Facebook en iOS', UA.facebookIOS, 5, 'in-app'],
    ['Chrome de Windows', UA.winChrome, 0, 'desktop-chromium'],
    ['Edge de Windows', UA.winEdge, 0, 'desktop-chromium'],
    ['Firefox de Windows', UA.winFirefox, 0, 'desktop-firefox'],
  ];

  it.each(cases)('%s', (_name, userAgent, maxTouchPoints, expected) => {
    expect(detectInstallPlatform({ userAgent, maxTouchPoints })).toBe(expected);
  });

  it('sin datos cae en escritorio Chromium', () => {
    expect(detectInstallPlatform({})).toBe('desktop-chromium');
  });
});

describe('INSTALL_GUIDES', () => {
  const entries = Object.entries(INSTALL_GUIDES);

  it('cubre todas las plataformas y el orden de "otras guías"', () => {
    expect(Object.keys(INSTALL_GUIDES)).toHaveLength(9);
    OTHER_GUIDES_ORDER.forEach((key) => expect(INSTALL_GUIDES[key]).toBeDefined());
  });

  it.each(entries)('%s tiene device, intro y pasos con texto e ícono conocido', (key, guide) => {
    expect(guide.device).toBeTruthy();
    expect(guide.intro).toBeTruthy();
    if (key !== 'desktop-firefox') expect(guide.steps.length).toBeGreaterThanOrEqual(2);
    guide.steps.forEach((step) => {
      expect(step.text.length).toBeGreaterThan(5);
      expect(INSTALL_ICONS).toContain(step.icon);
    });
  });

  it('nunca usa jerga técnica', () => {
    const all = JSON.stringify([INSTALL_GUIDES, INSTALL_CLOSING]);
    expect(all).not.toMatch(/menú del navegador/i);
    expect(all).not.toMatch(/barra de navegación/i);
    expect(all).not.toMatch(/PWA/);
  });
});
