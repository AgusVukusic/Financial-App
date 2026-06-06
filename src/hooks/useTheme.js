import { useState, useEffect } from 'react';

const THEME_KEY = 'financial_app_theme';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      return savedTheme || 'dark'; // dark is default
    } catch (error) {
      return 'dark';
    }
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
};
