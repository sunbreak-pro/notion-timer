import { useState, useEffect, type ReactNode } from 'react';
import { ThemeContext, type Theme, type FontSize } from './themeContextValue';

export type { Theme, FontSize };

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('sonic-flow-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('sonic-flow-font-size');
    return (saved === 'small' || saved === 'medium' || saved === 'large') ? saved : 'medium';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sonic-flow-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[fontSize]);
    localStorage.setItem('sonic-flow-font-size', fontSize);
  }, [fontSize]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const setFontSize = (size: FontSize) => setFontSizeState(size);

  return (
    <ThemeContext.Provider value={{ theme, fontSize, toggleTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}
