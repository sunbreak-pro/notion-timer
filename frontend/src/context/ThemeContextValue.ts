import { createContext } from 'react';

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  toggleTheme: () => void;
  setFontSize: (size: FontSize) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
