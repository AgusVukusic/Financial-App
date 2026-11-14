import { useState, useEffect } from 'react';

const THEME_KEY = 'financial_app_theme';
// Mismos valores que --bg en src/styles/tokens.css (la barra del sistema debe coincidir con el fondo).
const THEME_COLOR = { dark: '#131311', light: '#efece2' };

/** Tema guardado; si no hay, el del sistema (claro y oscuro valen lo mismo). */
const initialTheme = () => {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage bloqueado: seguimos con el del sistema */
  }
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* sin almacenamiento: el tema vale solo para esta sesión */
    }
    document.body.classList.toggle('light-theme', theme === 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
};
