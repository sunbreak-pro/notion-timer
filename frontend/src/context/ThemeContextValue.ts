import { createContext } from 'react';

export type Theme = 'light' | 'dark';
export type FontSize = number; // 1〜10
export type Language = 'en' | 'ja';

export interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  toggleTheme: () => void;
  setFontSize: (size: FontSize) => void;
  setLanguage: (lang: Language) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
