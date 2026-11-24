import { useState, useEffect, useCallback } from 'react';

export function useTheme(defaultTheme = 'light') {
  const [theme, setTheme] = useState(() => localStorage.getItem('portal_theme') || defaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portal_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}

export default useTheme;
